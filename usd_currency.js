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
        if (e.key === 'Backspace') {
            value = '0' + value.substring(0, value.length - 1);
        } else {
            value += e.key.match(/\d/) ? e.key : '';
        }
        input_element.value = format_input_value(value);
        input_element.setSelectionRange(input_element.value.length, input_element.value.length);
        update_shadow_object();
        e.preventDefault();
    }

    function bind_listeners() {
        input_element.addEventListener('keydown', handle_input);
        input_element.addEventListener('click', () => {
            input_element.setSelectionRange(input_element.value.length, input_element.value.length);
        });
    }

    function unbind_listeners() {
        document.removeEventListener('keydown', handle_input);
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