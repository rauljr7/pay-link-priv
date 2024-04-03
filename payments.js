window.turnstile_loaded_once = false;

// Define the onload callback function
window.turnstile_loaded = function() {
  turnstile.render('#turstile_id', {
      sitekey: '0x4AAAAAAAWGXMWIf7aN7NSS',
      callback: init
  });
};

function turnstile_load() {
  const script = document.createElement('script');
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=turnstile_loaded";
  script.defer = true;
  document.head.appendChild(script);
}

// Call the function to load the script
turnstile_load();

const init = async (token) => {
  if (!token) {
      token = "";
  }
  if (window.turnstile_loaded_once === false) {
      window.turnstile_loaded_once = true;
  } else {
      return;
  }
  const payment_endpoint = "https://wke23rj4i7ezl6bzxcqu33uq4m0vszcn.lambda-url.us-east-1.on.aws/";
  let client_id_fetch_options = {
      "method": "POST",
      "body": ""
  };
  client_id_fetch_options.body = JSON.stringify({
      "method": "get_client_id",
      "turnstile_id": token,
      "type": payment_link.type
  });
  let paypal_client_id_response = await fetch(payment_endpoint, client_id_fetch_options).then(response => response.json());
  paypal_client_id = paypal_client_id_response.paypal_client_id;

  const paypal_script_object = {
      "client-id": paypal_client_id,
      "currency": "USD",
      "enable-funding": "venmo",
      "components": "googlepay,buttons,card-fields,applepay"
  };
  let paypal_script_attributes = {};
  if (payment_link.type === "recurring") {
      paypal_script_attributes = {
          "data-user-id-token": paypal_client_id_response.id_token
      };
  }

  const pay_operation = (pay_operation_object) => {
      let fetch_options = {
          "method": "POST",
          "body": ""
      };
      if (pay_operation_object.method === "order") {
          fetch_options.body = JSON.stringify({
              "method": pay_operation_object.method,
              "amount": document.getElementById("amount").value,
              "type": payment_link.type,
              "payment_source": pay_operation_object.payment_source
          });
      } else
      if (pay_operation_object.method === "complete") {
          fetch_options.body = JSON.stringify({
              "method": pay_operation_object.method,
              "order_id": pay_operation_object.order_id
          });
      }

      /*//For vault without purchase
        else
      if (pay_operation_object.method === "setup_token") {
        fetch_options.body = JSON.stringify({ "method": pay_operation_object.method, "payment_source": pay_operation_object.payment_source });
      } else
      if (pay_operation_object.method === "setup_vault") {
        fetch_options.body = JSON.stringify({ "method": pay_operation_object.method, "setup_vault_token": pay_operation_object.setup_vault_token });
      } */

      let pay_operation_request = fetch(payment_endpoint, fetch_options);
      return pay_operation_request;
  }

  function load_script_tag(script_base_url, script_query_params = {}, attributes = {}) {
      return new Promise((resolve, reject) => {
          // Prepare query string from script_query_params if any
          const query_params_string = Object.keys(script_query_params).length > 0 ?
              '?' + Object.entries(script_query_params)
              .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
              .join('&') :
              '';
          const combined_url = `${script_base_url}${query_params_string}`;

          // Create script element
          const script_element = document.createElement('script');
          script_element.src = combined_url;

          // Set additional attributes on the script tag
          Object.entries(attributes).forEach(([key, value]) => {
              script_element.setAttribute(key, value);
          });

          // Resolve or reject the promise based on the script loading
          script_element.onload = () => resolve(script_element);
          script_element.onerror = () => reject(new Error(`Script load error for ${combined_url}`));

          // Append script to the document head
          document.head.appendChild(script_element);
      });
  }

  const create_order_func = async (payload) => {
    console.log(payload.paymentSource);
      try {
          let paypal_order_request = await pay_operation({
              "method": "order",
              "payment_source": payload.paymentSource
          });
          let paypal_order_response = await paypal_order_request.json();
          if (!paypal_order_response.id) {
              let paypal_error_detail = paypal_order_response?.details?.[0];
              let paypal_error_message;
              if (paypal_error_detail) {
                  paypal_error_message = `${error_details.issue} ${error_details.description} (${paypal_order_response.debug_id})`;
              } else {
                  paypal_error_detail = JSON.stringify(paypal_order_response);
              }
              throw new Error(paypal_error_message);
          }
          return paypal_order_response.id;
      } catch (error) {
          console.error(error);
          resultMessage(`Could not initiate PayPal Checkout...<br><br>${error}`);
      }
  }

  const on_approve_func = async (data, actions) => {
      try {
          let paypal_complete_request = await pay_operation({
              "method": "complete",
              "order_id": data.orderID
          });
          let paypal_complete_response = await paypal_complete_request.json();
          let complete_error_detail = paypal_complete_response?.details?.[0];
          if (complete_error_detail?.issue === "INSTRUMENT_DECLINED") {
              return actions.restart();
          } else if (complete_error_detail) {
              throw new Error(`${complete_error_detail.description} (${paypal_complete_response.debug_id})`);
          } else if (!paypal_complete_response.purchase_units) {
              throw new Error(JSON.stringify(paypal_complete_response));
          } else {
              let transaction =
                  paypal_complete_response?.purchase_units?.[0]?.payments?.captures?.[0] ||
                  paypal_complete_response?.purchase_units?.[0]?.payments?.authorizations?.[0];
              console.log("Capture result", paypal_complete_response, JSON.stringify(paypal_complete_response, null, 2), );
              resultMessage(`Transaction ${transaction.status}: ${transaction.id}<br><br>See console for all available details`, );
          }
      } catch (error) {
          console.error(error);
          resultMessage(`Sorry, your transaction could not be processed...<br><br>${error}`, );
      }
  }
  let payment_options_object;
  payment_options_object = {
      "onApprove": on_approve_func,
      "createOrder": create_order_func,
      onCancel(data, actions) {
          console.log(`Order Canceled - ID: ${data.orderID}`);
      },
      onError(err) {
          console.error(err);
      }
  };

  /* //For vault without purchase
    const create_vault_setup_token_func = async ({payment_source} = "paypal") => {
      try {
        let vault_setup_token_request = await pay_operation({"method": "setup_token", "payment_source": payment_source});
        let vault_setup_token_response = await vault_setup_token_request.json();
        console.log(vault_setup_token_response);
        return vault_setup_token_response.token;
      } catch (error) {
        console.error(error);
        resultMessage( `Sorry, your transaction could not be processed...<br><br>${error}`, );
      }
    }

      if (payment_link.type === "one-time") {
      payment_options_object.createOrder = create_order_func;
    } else
    if (payment_link.type === "recurring") {
      delete payment_options_object.createOrder;
      payment_options_object.createVaultSetupToken = create_vault_setup_token_func;
      payment_options_object.onApprove = async ({ vaultSetupToken }) => {
        vault_setup_token_string = vaultSetupToken;
        try {
          let setup_vault_request = await pay_operation({"method": "setup_vault", "setup_vault_token": vault_setup_token_string});
          let setup_vault_response = await setup_vault_request.json();
          console.log(setup_vault_response);
        } catch (error) {
          console.error(error);
          resultMessage( `Sorry, your transaction could not be processed...<br><br>${error}`, );
        }
      }
    }  */

  load_script_tag("https://www.paypal.com/sdk/js", paypal_script_object, paypal_script_attributes).then(() => {
    const renders_array = [];
    payment_options_object.fundingSource = paypal.FUNDING.PAYPAL;
    let paypal_button = window.paypal.Buttons(payment_options_object);
    if (paypal_button.isEligible()) {
        renders_array.push(paypal_button.render("#pay-paypal"));
    }
    payment_options_object.fundingSource = paypal.FUNDING.VENMO;
    let venmo_button = window.paypal.Buttons(payment_options_object);
    if (venmo_button.isEligible()) {
        renders_array.push(venmo_button.render("#pay-venmo"));
    }

    const card_style = {
        'input': {
            'font-family': 'Inter, sans-serif',
            'font-size': '.98rem',
            'color': 'black',
            'padding': '8px'
        },
        '.invalid': {
            'color': 'red',
        },
    };
    payment_options_object.style = card_style;
    const card_fields = paypal.CardFields(payment_options_object);

    if (card_fields.isEligible()) {
        const number_field = card_fields.NumberField();
        renders_array.push(number_field.render("#card-number-field-container"));
        const cvv_field = card_fields.CVVField();
        renders_array.push(cvv_field.render("#card-cvv-field-container"));
        const expiry_field = card_fields.ExpiryField();
        renders_array.push(expiry_field.render("#card-expiry-field-container"));

        // Raul adjust this
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                card_fields.submit().then((res) => {
                    console.log(res);
                });
            }
        });
    }
    Promise.all(renders_array).then(async () => {
        if (paypal.Googlepay) {
            load_script_tag('https://pay.google.com/gp/p/js/pay.js').then(() => {
                onGooglePayLoaded().catch(console.error);
            }).catch(error => {
                console.error("Error loading Google Pay SDK:", error);
            });
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        document.getElementById("loading").classList.add("hide");
        const paymentMethods = document.getElementById("payment-methods");
        paymentMethods.classList.remove("hide");
        setTimeout(() => paymentMethods.classList.add("fade-in"), 100);
    });
}).catch(error => console.error("Script loading failed", error));
  /**
   * An initialized google.payments.api.PaymentsClient object or null if not yet set
   * An initialized paypal.Googlepay().config() response object or null if not yet set
   *
   * @see {@link getGooglePaymentsClient}
   */
  let paymentsClient = null,
      google_pay_config = null;
  /**
   * 
   * @returns Fetch the Google Pay Config From PayPal 
   */
  async function get_google_pay_config() {
      if (google_pay_config === null) {
          google_pay_config = await paypal.Googlepay().config();

      }
      return google_pay_config;
  }
  /**
   * Configure support for the Google Pay API
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#PaymentDataRequest|PaymentDataRequest}
   * @returns {object} PaymentDataRequest fields
   */
  async function getGooglePaymentDataRequest() {
      const {
          allowedPaymentMethods,
          merchantInfo,
          apiVersion,
          apiVersionMinor,
          countryCode
      } = await get_google_pay_config();
      const baseRequest = {
          apiVersion,
          apiVersionMinor
      }
      const paymentDataRequest = Object.assign({}, baseRequest);
      paymentDataRequest.allowedPaymentMethods = allowedPaymentMethods;
      paymentDataRequest.transactionInfo = getGoogleTransactionInfo(countryCode);
      paymentDataRequest.merchantInfo = merchantInfo;
      paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];
      return paymentDataRequest;
  }
  /**
   * Handles authorize payments callback intents.
   *
   * @param {object} paymentData response from Google Pay API after a payer approves payment through user gesture.
   * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#PaymentData object reference}
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#PaymentAuthorizationResult}
   * @returns Promise<{object}> Promise of PaymentAuthorizationResult object to acknowledge the payment authorization status.
   */
  function onPaymentAuthorized(paymentData) {
      return new Promise(function(resolve, reject) {
          processPayment(paymentData)
              .then(function() {
                  resolve({
                      transactionState: 'SUCCESS'
                  });
              })
              .catch(function() {
                  resolve({
                      transactionState: 'ERROR'
                  });
              });
      });
  }
  /**
   * Return an active PaymentsClient or initialize
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/client#PaymentsClient|PaymentsClient constructor}
   * @returns {google.payments.api.PaymentsClient} Google Pay API client
   */
  function getGooglePaymentsClient() {
      if (paymentsClient === null) {
          paymentsClient = new google.payments.api.PaymentsClient({
              environment: 'TEST',
              paymentDataCallbacks: {
                  onPaymentAuthorized: onPaymentAuthorized
              }
          });
      }
      return paymentsClient;
  }
  /**
   * Initialize Google PaymentsClient after Google-hosted JavaScript has loaded
   *
   * Display a Google Pay payment button after confirmation of the viewer's
   * ability to pay.
   */
  async function onGooglePayLoaded() {
      const paymentsClient = getGooglePaymentsClient();
      const {
          allowedPaymentMethods,
          apiVersion,
          apiVersionMinor
      } = await get_google_pay_config();
      paymentsClient.isReadyToPay({
              allowedPaymentMethods,
              apiVersion,
              apiVersionMinor
          })
          .then(function(response) {
              if (response.result) {
                  addGooglePayButton();
              }
          })
          .catch(function(err) {
              console.error(err);
          });
  }
  /**
   * Add a Google Pay purchase button alongside an existing checkout button
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#ButtonOptions|Button options}
   * @see {@link https://developers.google.com/pay/api/web/guides/brand-guidelines|Google Pay brand guidelines}
   */
  function addGooglePayButton() {
      const paymentsClient = getGooglePaymentsClient();
      const button = paymentsClient.createButton({
          buttonColor: 'black',
          buttonType: 'plain',
          buttonSizeMode: 'fill',
          onClick: onGooglePaymentButtonClicked
      });
      document.getElementById("pay-google-pay").appendChild(button);
  }
  /**
   * Provide Google Pay API with a payment amount, currency, and amount status
   *
   * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#TransactionInfo|TransactionInfo}
   * @returns {object} transaction info, suitable for use as transactionInfo property of PaymentDataRequest
   */
  function getGoogleTransactionInfo(countryCode) {
      return {
          displayItems: [{
              label: "Subtotal",
              type: "SUBTOTAL",
              price: document.getElementById("amount").value,
          }],
          countryCode: countryCode,
          currencyCode: "USD",
          totalPriceStatus: "FINAL",
          totalPrice: document.getElementById("amount").value,
          totalPriceLabel: "Total"
      };
  }
  /**
   * Show Google Pay payment sheet when Google Pay payment button is clicked
   */
  async function onGooglePaymentButtonClicked() {
      const paymentDataRequest = await getGooglePaymentDataRequest();
      const paymentsClient = getGooglePaymentsClient();
      paymentsClient.loadPaymentData(paymentDataRequest);
  }
  async function processPayment(paymentData) {
      return new Promise(async function(resolve, reject) {
          try {
              const order_request = await pay_operation({
                  "method": "order"
              });
              let {
                  id
              } = await order_request.json();
              const confirmOrderResponse = await paypal.Googlepay().confirmOrder({
                  orderId: id,
                  paymentMethodData: paymentData.paymentMethodData
              });
              if (confirmOrderResponse.status === "APPROVED") {
                  const response = await pay_operation({
                      "method": "complete",
                      "order_id": id
                  });
                  const jsonResponse = await response.json();
                  resultMessage(`Transaction ${jsonResponse.status}: ${jsonResponse.id}<br><br>See console for all available details`);
                  if (jsonResponse.status === "COMPLETED") {
                      resolve({
                          transactionState: 'SUCCESS'
                      });
                  } else {
                      resolve({
                          transactionState: 'ERROR',
                          error: {
                              intent: 'PAYMENT_AUTHORIZATION',
                              message: 'TRANSACTION FAILED',
                          }
                      });
                  }
              } else {
                  resolve({
                      transactionState: 'ERROR',
                      error: {
                          intent: 'PAYMENT_AUTHORIZATION',
                          message: 'TRANSACTION FAILED',
                      }
                  });
              }
          } catch (err) {
              resolve({
                  transactionState: 'ERROR',
                  error: {
                      intent: 'PAYMENT_AUTHORIZATION',
                      message: err.message,
                  }
              });
          }
      });
  }
  //APPLE PAY FUNCTIONS
  async function setup_apple_pay() {
      const applepay = paypal.Applepay();
      const {
          isEligible,
          countryCode,
          currencyCode,
          merchantCapabilities,
          supportedNetworks
      } = await applepay.config();
      if (!isEligible) {
          throw new Error("applepay is not eligible");
      }
      document.getElementById("pay-apple-pay-div").innerHTML = '<apple-pay-button id="pay-apple-pay" buttonstyle="black" type="plain" locale="en">';
      function getCurrentDateTimeISO() {
        return new Date().toISOString();
      }
      async function handle_apple_pay_click() {
            const paymentRequest = {
                countryCode,
                currencyCode: 'USD',
                merchantCapabilities,
                supportedNetworks,
                requiredBillingContactFields: ["name", "phone", "email", "postalAddress"],
                requiredShippingContactFields: [],
                total: {
                    label: "Demo (Card is not charged)",
                    amount: document.getElementById("amount").value,
                    type: "final",
                },
            };
            if (payment_link.type === "recurring") {
                let recurringStartDate = getCurrentDateTimeISO();
                paymentRequest.lineItems = [
                    {
                        label: "Recurring",
                        amount: document.getElementById("amount").value,
                        paymentTiming: "recurring",
                        recurringPaymentStartDate: recurringStartDate
                    }
                ];
            }
          let apple_pay_session = new ApplePaySession(4, paymentRequest);
          apple_pay_session.onvalidatemerchant = (event) => {
              applepay.validateMerchant({
                  validationUrl: event.validationURL,
              }).then((payload) => {
                  apple_pay_session.completeMerchantValidation(payload.merchantSession);
              }).catch((err) => {
                  console.error(err);
                  apple_pay_session.abort();
              });
          };
          apple_pay_session.onpaymentmethodselected = () => {
              apple_pay_session.completePaymentMethodSelection({
                  newTotal: paymentRequest.total,
              });
          };
          apple_pay_session.onpaymentauthorized = async (event) => {
              try {
                  const apple_pay_order_request = await pay_operation({
                      "method": "order"
                  });
                  const apple_pay_order_response = await apple_pay_order_request.json();
                  if (!apple_pay_order_response.id) {
                      throw new Error("error creating order")
                  }
                  let order_id = apple_pay_order_response.id;
                  /* Confirm Payment */
                  await applepay.confirmOrder({
                      orderId: order_id,
                      token: event.payment.token,
                      billingContact: event.payment.billingContact,
                      shippingContact: event.payment.shippingContact
                  });
                  pay_operation({
                      "method": "complete",
                      "order_id": order_id
                  }).then(apple_complete_request => {
                      return apple_complete_request.json();
                  }).then(apple_complete_response => {
                      resultMessage(`Transaction ${apple_complete_response.status}: ${apple_complete_response.id}<br><br>See console for all available details`, );
                      apple_pay_session.completePayment({
                          status: window.ApplePaySession.STATUS_SUCCESS,
                      });
                  })
              } catch (err) {
                  console.error(err);
                  apple_pay_session.completePayment({
                      status: window.ApplePaySession.STATUS_FAILURE,
                  });
              }
          };
          apple_pay_session.oncancel = () => {
              console.log("Apple Pay Cancelled !!")
          }
          apple_pay_session.begin();
      }
      document.getElementById("pay-apple-pay").addEventListener("click", handle_apple_pay_click);
  }
  if (typeof ApplePaySession !== 'undefined' && ApplePaySession.supportsVersion(4) && ApplePaySession.canMakePayments()) {
      load_script_tag('https://applepay.cdn-apple.com/jsapi/v1/apple-pay-sdk.js').then(() => {
          setup_apple_pay().catch(error => {
              console.error(error);
          });
      }).catch(error => {
          console.error(error);
          document.getElementById("pay-apple-pay-div").style.display = "none";
      });
  } else {
      document.getElementById("pay-apple-pay-div").style.display = "none";
      console.log("Apple Pay is not supported on this browser or device.");
  }

  function resultMessage(message) {
      const container = document.querySelector("#result-message");
      container.innerHTML = message;
  }

  document.getElementById('moon').addEventListener('click', function() {
      const doc_elem = document.documentElement;
      const current_theme = doc_elem.getAttribute('data-theme');
      if (current_theme === 'dark') {
          doc_elem.setAttribute('data-theme', 'light');
      } else {
          doc_elem.setAttribute('data-theme', 'dark');
      }
  });

}

//init();