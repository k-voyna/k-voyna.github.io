/*jslint plusplus: true */
/*global $: true, jQuery: true */

// XXX: Дописывать .000 где стоит заданная точность

// aux 
function isInt (n) {"use strict";
   return typeof n === 'number' && n % 1 === 0;
}

// public: ------------------------------------------------------
Calc = {};

// switches
Calc.updateSwitch = function () {"use strict";
    var i, id;    
    var classes = $(this).parents ("tr").attr ('class').split(" ");
    
    for (i = 0; i < classes.length; ++i) {
        if (classes [i].indexOf('calc-row--') === 0) {
            id = classes [i].split ("--") [1];
        }
    }

    var index = $(this).find ("option:selected").index ();

    $(".calc tr[class*='calc-case--" + id + "']").hide ().addClass ("calc-input-hidden");
        
    $("tr[class*='calc-case--" + id + "-" + (index + 1) + "--']").each (function () {       
        if ($(this).hasClass ("calc-row-hidden")) {
            return;
        }
            
        var classes = $(this).attr ('class').split(" ");
        var orClauses = [];
        var andClauses = [];
                
        // сохраняем в ids все cases
        for (var i = 0; i < classes.length; ++i) {        
            if (classes [i].indexOf('calc-case--') === 0) {
                var chunks = classes [i].split ("--");
                var str = chunks[1].split ("-");

                var id = str [0] + '-' + str [1];
                var value = str [2];

                if (chunks[2] === 'and') {
                    andClauses.push ([id, value]);
                } else {
                    orClauses.push ([id, value]);
                }
            }
        }
       
        var shown = false;
        
        for (var i = 0; i < orClauses.length; ++i) {  
            var clause = orClauses [i];
            var index = $("tr.calc-row--" + clause[0]).find ("option:selected").index () + 1;
                        
            if (index == clause[1]) {
                shown = true;
                break;
            }
        }
                
        for (var i = 0; i < andClauses.length; ++i) {   
            var clause = andClauses [i];        
            var index = $("tr.calc-row--" + clause[0]).find ("option:selected").index () + 1;
            shown = shown && index == clause[1];
        }
        
        if (shown)
            $(this).show ().removeClass ("calc-input-hidden");
    });
};

Calc.update = function (recalc) {"use strict";
    $("tr.calc-message").hide ();
    // FIXME: tr class   
    $(".calc .error").removeClass ("error");
    $(".calc .warning").removeClass ("warning");
    $(".calc select").each (Calc.updateSwitch);
        
    recalc ();
};

Calc.init = function (recalc) {"use strict";  
    $("input.calc-set-switch").change (function () {
        var name, val;
        
        name = $(this).attr('name');
        val = $(this).val ();
                
        $("#calc-set--" + name + " div.calc-table").hide ();               
        $("#calc-table--" + val).show ();
    });
    
    $("input.calc-set-switch:checked").each (function () {
        $('input[name="' + $(this).attr ('name') + '"]:first').click ();
    });
    /*
    // TODO: Проверка внутри    
    $(".calc-input-real input").change (function () {
        var val = $(this).val ();
        
        // TODO: add message
        
        if (isNaN (val)) {
            $(this).addClass ("error");
        } else {
            $(this).removeClass ("error");
        }
    });

    // TODO: Проверка внутри
    $(".calc-input-int input").change (function () {
        var val = parseFloat ($(this).val ());
        if (!isInt (val)) {
            $(this).addClass ("error");
        } else {
            $(this).removeClass ("error");
        }
    }); */
    
    $("table.calc-table input, table.calc-table select").change (function () {
    //    if (!$(this).hasClass ("error")) {
            Calc.update (recalc);
    //    }
    });

    $(".calc select").change (Calc.updateSwitch);
       
    $(".calc-tool input.calc-result-switch").change (function () {
        // FIXME tr class
        var row = $(this).parents ("div.calc-table").find ("table").find ("tr.optional:not(.calc-message):not(.calc-error)");
        
        if ($(this).is (':checked')) {
            row.removeClass ('calc-row-hidden');
            row.show ();
        } else {
            row.addClass ('calc-row-hidden');
            row.hide ();
        }
        
        $(".calc select").each (Calc.updateSwitch);
    });
    
    Calc.update (recalc);
};

Calc.calc = function (table, method) {"use strict";
    // declaration
    var prefix, key, format, value, valid, id, type, group, 
        data, errors, warnings;

    // functions
    function fnPlot (table, index) {
        if (index === undefined) {
            index = 0;
        }
        
        return $("#calc-plot--" + table + "-" + index);
    }
    
    function fnRow (table, row) {
        return $("#calc-row--" + table + "-" + row);
    }

    function fnMessage (table, msg) {
        return $("#calc-msg--" + table + "-" + msg);
    }

    function fnCell (table, row, selector) {
        return $("#calc-row--" + table + "-" + row + " " + selector);
    }

    function fnInputType (table, row) {
        var result, input;
    
        input = fnRow (table, row);

        /*if (input.hasClass ("calc-input-hidden"))
            return undefined;*/
        
        if (input.hasClass ("calc-input-enum")) {
            result = "enum";
        } else if (input.hasClass ("calc-input-real")) {
            result = "real";
        } else if (input.hasClass ("calc-input-int")) {
            result = "int";
        } 
    
        return result;
    }

    function fnInputReal (table, row, factor) {   
        return parseFloat (fnCell (table, row, "input").val ()) * factor;
    }

    function fnInputInt (table, row) {
        return parseInt (fnCell (table, row, "input").val (), 10);
    }

    function fnInputEnum (table, row, values) {
        var result, input;

        input = fnCell (table, row, "option:selected");

        if (values.length) {
            result = values [input.index ()];
        } else {
            result = input.val ();
        }
    
        return result;
    }
  
    function fnOutputString (table, row, value) {
        fnCell (table, row, ".calc-cell-value").text (value);
    }

    function fnFormatTech (value, precision) {
        var absval = Math.abs (value);
    
        if (absval > 1e12) {
            return (value > 0) ? "\u221E" : "−\u221E";;
        } else if (absval >= 1e9) {
            return Number ((value * 1e-9).toPrecision (precision)) + '&sdot;10<sup>9</sup>';
        } else if (absval >= 1e6) {
            return Number ((value * 1e-6).toPrecision (precision)) + '&sdot;10<sup>6</sup>';
        } else if (absval >= 1e6) {
            return Number ((value * 1e-3).toPrecision (precision)) + '&sdot;10<sup>3</sup>';
        } else if (absval < 1e6 && absval >= 1e4) {
            var dig = value % 1e3;
            return ((value - dig) * 1e-3) + '&#8239;' + (dig < 10 ? ("00" + dig) : dig < 100 ? ("0" + dig) : dig);
        } else if (absval < 1e4 && absval > 1e-4) {
            return value;
        } else if (absval > 1e-6) {
            return Number ((value * 1e6).toPrecision (precision)) + '&sdot;10<sup>−6</sup>';
        } else if (absval > 1e-9) {
            return Number ((value * 1e9).toPrecision (precision)) + '&sdot;10<sup>−9</sup>';
        } else if (absval > 1e-12) {
            return Number ((value * 1e12).toPrecision (precision)) + '&sdot;10<sup>−12</sup>';
        } else {
            return 0;
        }
    }    
    
    function fnOutputReal (table, row, value, factor, precision) {       
        var text;
            precision = 2;
        if (isNaN (value)) {
            text = "?";
        } else {
            var num = Number ((value / factor).toPrecision (precision));
            var exp = Math.log (Math.abs (num)) / Math.LN10;
           
            if (num === 0) {
                text = "0";
            } else if (exp < -3) {
                text = "~0";
            } else if (exp > 4) {
                // text = (value > 0) ? "\u221E" : "−\u221E";
                // text =  (value > 0) ? "&gt; 10<sup>4</sup>" : "&lt; −10<sup>4</sup>";
                text = fnFormatTech (num, precision);
            } else if (num > 0) {
                text = num;
            } else {
                text = "−" + Math.abs (num);
            }
        }
               
        fnCell (table, row, ".calc-cell-value").empty ().append (text); 
    }
    
    function fnFormatExp (value, factor, precision) {
        if (value === 0) {
            return 0;
        } else if (!isNaN (value)) {           
            var exp = ((Math.log (Math.abs (value) / factor) / Math.LN10) - 0.5).toFixed (0);
            var num = Number ((value / factor / Math.pow (10, exp)).toPrecision (precision));
               
            var text;
            if (num == 0) {
                text = "0";
            } else if (exp == 0) {
                text = num;
            } else {
                if (num !== 10) {
                    text = num + '&sdot;10<sup>' + exp + '</sup>'
                } else if (exp != -1) {
                    text = '10<sup>' + (parseInt (exp) + 1) + '</sup>'
                } else {
                    text = '1';
                }
            }
        
            return text;
        } else {
            return "?";
        }
    }
    
    function fnOutputExp (table, row, value, factor, precision) {
        fnCell (table, row, ".calc-cell-value").empty ().append (fnFormatExp (value, factor, precision));            
    }
        
    function fnOutputComplex (table, row, value, factor, precision) {
        var text;
    
        if (!isNaN (value.x) && !isNaN (value.y)) {
            var numRe = Number ((value.x / factor).toPrecision (precision));
            var expRe = Math.log (Math.abs (numRe)) / Math.LN10;
        
            var numIm = Number ((value.y / factor).toPrecision (precision));
            var expIm = Math.log (Math.abs (numIm)) / Math.LN10;
            
            if (expRe - expIm > 6) {
                numIm = 0;
            }

            if (expIm - expRe > 6) {
                numRe = 0;
            }
                         
            var sign = value.y >= 0 ? "+" : "−";
            
            if (Math.abs (numRe) > 1e4 || Math.abs (numRe) < 1e-3) {
                numRe = fnFormatTech (numRe, precision);
            }

            numIm = Math.abs (numIm);
            
            if (numIm > 1e4 || numIm < 1e-3) {
                numIm = fnFormatTech (numIm, precision);
            }
            
            text = numRe + "" + sign + "j" + numIm; 
        } else {
            text = "?";
        }
        
        fnCell (table, row, ".calc-cell-value").empty ().append (text);
    }

    function fnOutputMessage (table, message, type) {
        var msg, classList;

        msg = fnMessage (table, message);

        classList = msg.attr ('class').split(/\s+/);
        $(classList).each (function (index) {
            var str = classList [index];
            if (str.indexOf ("calc-row--") === 0) {
                $ ("#" + str).addClass (type);
            }
        });

        msg.addClass (type).show ();
    }

    // variables
    data = {};
    errors = [];
    warnings = [];
    
    data.check = function (cond, id) {
        if (!cond) {
            errors.push (id);
        }
    };

    data.suggest = function (cond, id) {
        if (!cond) {
            warnings.push (id);
        }
    };
    
    data.plot = function (data, options, index) {
        $.plot (fnPlot (table.name, index), data, options);
    };
    
    valid = true;
    prefix = table.name;

    // input
    for (key in table.input) {
        if (table.input.hasOwnProperty (key)) {
            format = table.input [key];
            
            var input;
            if (format instanceof Array) {           
                type = fnInputType (prefix, key);
                
                if (type === "real") {
                    input = fnInputReal (prefix, key, format [0]);
                } else if (type === "int") {
                    input = fnInputInt (prefix, key);
                } else if (type === "enum") {
                    input = fnInputEnum (prefix, key, format);
                }
            } else {
                input = format;
            }

            data [key] = input;
        }
    }

    // calc
    method.call (data);

    // errors
    for (key in errors) {
        if (errors.hasOwnProperty (key)) {
            fnOutputMessage (prefix, errors [key], "error");
        }
    }

    // output
    for (key in table.output) {
        if (table.output.hasOwnProperty (key)) {
            format = table.output [key];
            
            // FIXME: check key duplicating
            
            if (format.length === 2) {
                fnOutputReal (prefix, key, data [key], format [0], format [1]);
            } else if (format.length === 3) {
                if (format [2] === 'complex') {
                    fnOutputComplex (prefix, key, data [key], format [0], format [1]);
                } else if (format [2] === 'exp') {
                    fnOutputExp (prefix, key, data [key], format [0], format [1]);
                }
            } else {
                fnOutputString (prefix, key, data [key]);
            }
        }
    }
       
    // warnings
    if (!errors.length) {
        for (key in warnings) {
            if (warnings.hasOwnProperty (key)) {
                fnOutputMessage (prefix, warnings [key], "warning");
            }
        }
    }

    return data;
    // FIXME: return !errors.length ? data : {};
};
