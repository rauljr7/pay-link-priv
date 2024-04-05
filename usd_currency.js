const usd_input = (function() {
    let shadow = {};
    let input_element = null;

    function format_input_value(value) {
        let numericValue = parseFloat(value.replace(/[^\d]/g, '')) / 100;
        return numericValue.toFixed(2);
    }

    function update_shadow_object() {
        if (!input_element) return;
        shadow = {
            value: input_element.value,
            caretPosition: input_element.value.length // Always at the far right
        };
    }

    function handle_input(e) {
        let value = input_element.value;
        // Remove non-numeric chars except for the first character if it's a decimal point
        value = value.replace(/[^0-9.]+/g, '');
        // Prevent more than one decimal point
        value = value.replace(/(\..*)\./g, '$1');
        // Ensure the value starts with "0." if it starts with a decimal point for correct formatting
        if (value.startsWith('.')) {
            value = '0' + value;
        }
        input_element.value = format_input_value(value);
        update_shadow_object();
        // Set the caret position to the end of the input
        input_element.setSelectionRange(input_element.value.length, input_element.value.length);
        window.payment_link.amount = input_element.value;
        e.preventDefault();
    }
    
    function bind_listeners() {
        // Listen to 'input' event for broader device compatibility
        input_element.addEventListener('input', handle_input);
        input_element.addEventListener('click', () => {
            input_element.setSelectionRange(input_element.value.length, input_element.value.length);
        });
    }
    
    // Adjust `unbind_listeners` function accordingly
    function unbind_listeners() {
        input_element.removeEventListener('input', handle_input);
    }    

    return {
        bind(selector) {
            input_element = document.querySelector(selector);
            if (!input_element) {
                console.error('Element not found');
                return;
            }
            bind_listeners();
            update_shadow_object();
        },
        unbind() {
            if (!input_element) {
                console.error('No element is bound');
                return;
            }
            unbind_listeners();
            input_element = null;
        },
        get_shadow() {
            return shadow;
        }
    };
})();
let currency_input = usd_input.bind("#amount");