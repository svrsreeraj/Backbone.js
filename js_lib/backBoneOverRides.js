(function ()
{

    var methods = {
        _unserializeFormSetValue: function (el, _value, override)
        {

            if ($(el).length > 1)
            {
                // Assume multiple elements of the same name are radio buttons
                $.each(el, function (i)
                {

                    var match = ($.isArray(_value) ? ($.inArray(this.value, _value) != -1) : (this.value == _value));

                    this.checked = match;
                });
            }
            else
            {
                // Assume, if only a single element, it is not a radio button
                if ($(el).attr("type") == "checkbox")
                {
                    $(el).attr("checked", true);
                }
                else
                {
                    if (override)
                    {
                        $(el).val(_value);
                    }
                    else
                    {
                        if (!$(el).val())
                        {

                        }
                        // Sreeraj - i moved it out of the if. We need it for all cases
                        $(el).val(_value);
                    }
                }
            }
        },

        _pushValue: function (obj, key, val)
        {
            if (null == obj[key]) obj[key] = val;
            else if (obj[key].push) obj[key].push(val);
            else obj[key] = [obj[key], val];
        }
    };

    $.fn.unserializeForm = function (_values, _options)
    {

        // Set up defaults
        var settings = $.extend(
        {
            'callback': undefined,
                'override-values': false
        }, _options);

        return this.each(function ()
        {
            // this small bit of unserializing borrowed from James Campbell's "JQuery Unserialize v1.0"
            _values = _values.split("&");
            _callback = settings["callback"];
            _override_values = settings["override-values"];

            if (_callback && typeof (_callback) !== "function")
            {
                _callback = undefined; // whatever they gave us wasn't a function, act as though it wasn't given
            }

            var serialized_values = new Array();
            $.each(_values, function ()
            {
                var properties = this.split("=");

                if ((typeof properties[0] != 'undefined') && (typeof properties[1] != 'undefined'))
                {
                    methods._pushValue(serialized_values, properties[0].replace(/\+/g, " "), decodeURI(properties[1].replace(/\+/g, " ")));
                }
            });

            // _values is now a proper array with values[hash_index] = associated_value
            _values = serialized_values;

            // Start with all checkboxes and radios unchecked, since an unchecked box will not show up in the serialized form
            $(this).live().find(":checked").attr("checked", false);

            // Iterate through each saved element and set the corresponding element
            for (var key in _values)
            {
                var el = $(this).live().add("input,select,textarea").find("[name=\"" + unescape(key) + "\"]");

                if (typeof (_values[key]) != "string")
                {
                    // select tags using 'multiple' will be arrays here (reports "object")
                    // We cannot do the simple unescape() because it will flatten the array.
                    // Instead, unescape each item individually
                    var _value = new Array();
                    $.each(_values[key], function (i, v)
                    {
                        _value.push(unescape(v));
                    })
                }
                else
                {
                    var _value = unescape(_values[key]);
                }

                if (_callback == undefined)
                {
                    // No callback specified - assume DOM elements exist
                    methods._unserializeFormSetValue(el, _value, _override_values);
                }
                else
                {
                    // Callback specified - don't assume DOM elements already exist
                    var result = _callback.call(this, unescape(key), _value, el);

                    // If they return true, it means they handled it. If not, we will handle it.
                    // Returning false then allows for DOM building without setting values.
                    if (result == false)
                    {
                        var el = $(this).live().add("input,select,textarea").find("[name=\"" + unescape(key) + "\"]");
                        // Try and find the element again as it may have just been created by the callback
                        methods._unserializeFormSetValue(el, _value, _override_values);
                    }
                }
            }
        })
    }

    Backbone.emulateHTTP = true;
    Backbone.emulateJSON = true;


    Backbone.Model.prototype.processFormData = function (formElement)
    {
        function processFrom(formElement, model)
        {
            formElement = typeof formElement !== 'undefined' ? formElement : $("form:first");
            processedFormData = {}

            this.getProcessedFormData = function (formData)
            {
                _.each(formData, function (obj)
                {
                    if (processedFormData.hasOwnProperty(obj.name))
                    {
                        if (typeof processedFormData[obj.name] !== 'object')
                        {
                            processedFormData[obj.name] = [processedFormData[obj.name], obj.value]
                        }
                        else
                        {
                            processedFormData[obj.name].push(obj.value)
                        }
                    }
                    else
                    {
                        processedFormData[obj.name] = obj.value
                    }
                })
                return processedFormData;
            }

            this.setModelData = function (processedData)
            {
                _.each(processedData, function (elementValue, elementName)
                {
                    model.set(elementName, elementValue,
                    {
                        silent: true
                    })
                })
            }

            var formData = formElement.serializeArray() //got input, select, textarea elements like $_POST in php
            var processedFormData = this.getProcessedFormData(formData)
            this.setModelData(processedFormData)
        }


        processFrom(formElement, this)
    }

    Backbone.Model.prototype.processModelData = function (formElement)
    {
        function processModel(formElement, model)
        {
            this.getSerializedStringFromModel = function (model)
            {
                var serializedString = '';
                _.each(model.attributes, function (value, name)
                {

                    if (typeof value === 'object')
                    {
                        for (var i = 0; i < value.length; i++)
                        {
                            serializedString += encodeURIComponent(name) + "=" + encodeURIComponent(value[i]) + "&"
                        }
                    }
                    else
                    {
                        serializedString += encodeURIComponent(name) + "=" + encodeURIComponent(value) + "&"
                    }
                })
                return serializedString.substring(0, serializedString.length - 1);
            }
            this.fillDataInElements = function (serializedData)
            {
                formElement.unserializeForm(serializedData);
            }
            var serializedData = this.getSerializedStringFromModel(model);
            this.fillDataInElements(serializedData);
        }
        processModel(formElement, this)
    }

    Backbone.newSync = Backbone.sync

    Backbone.sync = function (method, model, options)
    {
        var success = options.success;

        options.success = function (resp, status, xhr)
        {
            if (success)
            {
                if (resp)
                {
                    console.log(resp.header);
                    //jaicy
                    resp = resp.data
                    success(resp, status, xhr);
                }
            }
        }

        var error = options.error;

        options.error = function (xhr, status, thrown)
        {
            if (error) error(model, xhr, options);
        };

        Backbone.newSync(method, model, options)
    }
}).call(this);