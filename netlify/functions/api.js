import fetch from 'node-fetch';

const GLOBAL_TURNSTILE_GENERAL_SECRET = process.env.GLOBAL_TURNSTILE_GENERAL_SECRET;
const PAYPAL_CLIENT = process.env.PAYPAL_CLIENT;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

const generate_response = (message) => {
    if (message) {
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "message": message }),
        };
    }
};

const get_access_token = async (with_id_token = false) => {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT}:${PAYPAL_SECRET}`).toString("base64");
    let requestBody = "grant_type=client_credentials";
    if (with_id_token) {
      requestBody += "&response_type=id_token";
    }
    
    const access_token_request = await fetch(`${PAYPAL_ENDPOINT}/v1/oauth2/token`, {
      method: "POST",
      body: requestBody,
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    });
    
    const access_token_response = await access_token_request.json();
    
    if (!access_token_request) {
      throw new Error(access_token_response.error_description || "Failed to fetch access token");
    }

    return {
      id: access_token_response.access_token,
      id_token: access_token_response.id_token
    };
  } catch (error) {
      return generate_response(error);
  }
}

const create_paypal_order = async (request_object) => {
  try {
    let { amount, type, payment_source, label } = request_object;
    let { id: access_token } = await get_access_token();
    let create_order_endpoint = `${PAYPAL_ENDPOINT}/v2/checkout/orders`;
    let category = (label === "donate" || label === "donation") ? "DONATION" : "DIGITAL_GOODS";
    let purchase_unit_object = {
        "amount": {
          "currency_code": "USD",
          "value": amount,
          "breakdown": {
            "item_total": {
              "currency_code": "USD",
              "value": amount
            }
          }
        },
        "items": [{
          "name": "Pay Link",
          "quantity": "1",
          "category": category,
          "unit_amount": {
            "currency_code": "USD",
            "value": amount
          }
          }]
      };
      if (payment_source === "card") {
        purchase_unit_object.soft_descriptor = "XPLAINBILL.COM";
      }
    let payload = {
      "intent": "CAPTURE",
      "purchase_units": [purchase_unit_object],
    };
    payload.payment_source = {
      [payment_source]: {
        "experience_context": {
          "brand_name": "PMNT link",
          "shipping_preference": "NO_SHIPPING",
          "user_action": "PAY_NOW",
          "payment_method_preference": "IMMEDIATE_PAYMENT_REQUIRED",
          "return_url": "https://example.com/returnUrl",
          "cancel_url": "https://example.com/cancelUrl"
        },
      }
      };
      
      if (type === "sub") {
        payload.payment_source[payment_source].attributes = {
          "vault": {
            "store_in_vault": "ON_SUCCESS",
            "usage_type": "MERCHANT",
            "customer_type": "CONSUMER"
          }
        };
            
        if (payment_source === "apple_pay") {
          payload.payment_source[payment_source].stored_credential = {
                "payment_initiator": "CUSTOMER",
                "payment_type": "RECURRING"
              }
        }
      }
  
    let create_order_request = await fetch(create_order_endpoint, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      method: "POST",
      body: JSON.stringify(payload),
    });
  
    let json_response = await create_order_request.json();
    return json_response;
  } catch (error) {
    return generate_response(error.toString());
  }
};

const capture_paypal_order = async (order_id) => {
    let { id: access_token } = await get_access_token();
    let url = `${PAYPAL_ENDPOINT}/v2/checkout/orders/${order_id}/capture`;
    
    let capture_request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: "{}"
    });
    let capture_response = await capture_request.json();
    return capture_response;

};


export const handler = async (event) => {
  let request_body = JSON.parse(event.body);
  let amount = request_body.amount;
  let label = request_body.label;
  let method = request_body.method;
  let type = request_body.type;
  let payment_source = request_body.payment_source;
  let turnstile_id = request_body.turnstile_id;
  let order_id = request_body.order_id;
  
  if (method === "order") {
    let create_order_response = await create_paypal_order({amount, type, payment_source, label });
    return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({"id": create_order_response.id}),
    };
  } else
   if (method === "complete") {
    let capture_paypal_order_response;
    try {
      capture_paypal_order_response = await capture_paypal_order(order_id);
    } catch (error) {
      return generate_response(error.toString());
    }
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(capture_paypal_order_response),
    };
  }
 else
  if (method === "get_client_id") {
    if (turnstile_id) {
            let turnstile_secretKey = GLOBAL_TURNSTILE_GENERAL_SECRET;
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `secret=${turnstile_secretKey}&response=${turnstile_id}`,
      });

      const cloudflareTurnstileVerificationResult = await response.json();
      if (cloudflareTurnstileVerificationResult.success) {
        let id_token;
        if (type === "sub") {
          ({ id_token } = await get_access_token(true));
        }
          return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({"paypal_client_id": PAYPAL_CLIENT, "id_token": id_token}),
          };
      } else {
        return {
            statusCode: 401,
            headers: { 'Content-Type': 'application/json' }
        };
      }
    } else {
        let id_token;
        if (type === "sub") {
          ({ id_token } = await get_access_token(true));
        }
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({"paypal_client_id": PAYPAL_CLIENT, "id_token": id_token}),
        };
      }
      
  }
};
