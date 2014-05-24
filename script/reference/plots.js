/**
 * @author Voyna
 */
Plots = {
    logP : function () {"use strict";
        return {
            color : "#000000",
            axisLabel : "dB",
            position : "right",
            ticks : [[1e+0, "0"],
                     [1e-1, "-10"], 
                     [1e-2, "-20"],
                     [1e-3, "-30"],
                     [1e-4, "-40"],
                     [1e-5, "-50"],
                     [1e-6, "-60"],
                     [1e-7, "-70"],
                     [1e-8, "-80"]
                     ],
                             
            transform: function (y) {
                return Math.log (y + 1e-12); 
            }, 
                                             
            min : 1e-8,
            max : 1  
        };
    },        
    
    logDB : function () {"use strict";
        return {
            color : "#111",
            axisLabel : "Коэффициент усиления, дБи",
            position : "left"
        };
    },          
    
    logSWR : function () {"use strict";
        return {
            color : "#000000",
            axisLabel : "КСВ",
            ticks : [[1, "1"],
                     [2.0, "2"], 
                     [5.0, "5"],
                     [10.0, "10"],
                     [100.0, "100"],
                     [1000.0, "1000"],
                     [10000.0, "10000"]
                     ],
                             
            transform: function (y) {
                return Math.log (y + 1e-12); 
            }, 
                                             
            min : 1,
            max : 10000      
        };
    },       
    
    logF : function () {"use strict";
        return {
            color : "#000000",
            axisLabel : "Частота, МГц",
            ticks : [[1e6, "1"],
                     [1.8e6, "1,8"],
                     [3.5e6, "3,5"],
                     [7e6, "7"],
                     [14e6, "14"],
                     [21e6, "21"], 
                     [28e6, "28"]],
                             
            transform: function (y) {
                return Math.log (y + 1e-12); 
            }, 
                                             
            min : 1e6,
            max : 30e6       
        };
    },    
    logE : function () {"use strict";
        return {
            color : "#000000",
            axisLabel : "Напряженность поля, В/м",
            ticks : [
                     [1e-6, "10<sup>-6</sup>"], 
                     [10e-6, "10<sup>-5</sup>"], 
                     [100e-6, "10<sup>-4</sup>"], 
                     [1e-3, "10<sup>-3</sup>"], 
                     [10e-3, "10<sup>-2</sup>"], 
                     [100e-3, "10<sup>-1</sup>"], 
                     [1, "1"], 
                     [10, "10<sup>1</sup>"]],
                             
            transform: function (y) {
                return Math.log (y + 1e-12); 
            }, 
                                             
            min : 1e-5,
            max : 1e1       
        };
    },
    logD : function () {"use strict";
        return {
            ticks : [[1e3, "1"], [2e3, "2"], [3e3, ""], [4e3, ""], [5e3, "5"], [6e3, ""], [7e3, ""], [8e3, ""], [9e3, ""], 
                     [10e3, "10"], [20e3, "20"], [30e3, ""], [40e3, ""], [50e3, "50"], [60e3, ""], [70e3, ""], [80e3, ""], [90e3, ""],   
                     [100e3, "100"], [200e3, "200"], [300e3, ""], [400e3, ""], [500e3, "500"], [600e3, ""], [700e3, ""], [800e3, ""], [900e3, ""],
                     [1000e3, "1000"], [2000e3, "2000"], [3000e3, ""], [4000e3, ""], [5000e3, "5000"], [6000e3, ""], [7000e3, ""], [8000e3, ""], [9000e3, ""], 
                     [10000e3, "10000"]],
            color : "#000000",
            axisLabel : "Расстояние, км",
            transform:  function (y) {
                return Math.log (y + 0.0001); 
            },
           
            min : 1e3,
            max : 10000e3
        };
    },
    logZ : function () {"use strict";
        return {
            ticks: [[1, "1"],
                    [10, "10"],
                    [100, "100"], 
                    [1000, "1к"],     
                    [10000, "10к"],  
                    [100000, "100к"], 
                    [1e6, "1М"]],
            
            axisLabel : "Модуль импеданса, Ом",
            position : "left",               
            transform:  function (y) {
                return Math.log (y + 0.0001); 
            }, 

            color : "#000000",
            min : 1,
            max : 1e6
        };
    },
    logR : function () {"use strict";
        return {
            ticks: [[1e3, "1к"],
                    [10e3, "10к"],
                    [100e3, "100к"], 
                    [1000e3, "1М"],     
                    [10000e3, "10М"]],
            axisLabel : "Сопротивление, Ом",
            position : "bottom",               
            transform:  function (y) {
                return Math.log (y + 0.0001); 
            }, 

            color : "#000000",
            min : 1e3,
            max : 10e6
        };
    },    
    linPhi : function () {"use strict";
        return {
            ticks: [-90, -45, 0, 45, 90],
            position : "right",
            color : "#000000",
            axisLabel : "Фаза, °",
            tickDecimals: 0,
            min : -90,
            max : 90
        };   
    }, 
    linF : function () {"use strict";
        return {
            ticks: [[100e3, "100"], [200e3, ""], [300e3, ""], [400e3, ""], [500e3, "500"], 
                    [600e3, ""], [700e3, ""], [800e3, ""], [900e3, ""], [1000e3, "1000"], 
                    [1100e3, ""], [1200e3, ""], [1300e3, ""], [1400e3, ""], [1500e3, "1500"], 
                    [1600e3, ""], [1700e3, ""], [1800e3, ""], [1900e3, ""], [2000e3, "2000"]],
            min : 100e3,
            max : 2000e3,
                       
            axisLabel: "Частота, кГц",                        
            color : "#000000"
        };     
    },
    
    
    linFx : function (fmin, fmax) {"use strict";
        return {           
            tickFormatter : function formatter (val, axis) {
                if (Math.abs (val) < 1e3) {
                    return val.toFixed (axis.tickDecimals);
                } else if (Math.abs (val) < 1e6) {
                    return (val / 1e3).toString () + "к";
                } else {
                    return (val / 1e6).toString () + "М";
                } 
            },            
            
            min : fmin,
            max : fmax,            
            axisLabel: "Частота, Гц",                        
            color : "#111"
        };     
    },
    linRx : function () {"use strict";
        return {
            axisLabel: "Активное сопротивление, Ом",
            color : "#111",
            position: "left",
            tickFormatter : function formatter (val, axis) {
                if (Math.abs (val) < 1e3) {
                    return val.toFixed (axis.tickDecimals);
                } else if (Math.abs (val) < 1e6) {
                    return (val.toFixed (axis.tickDecimals) / 1e3).toString () + "к";
                } else {
                    return (val.toFixed (axis.tickDecimals) / 1e6).toString () + "М";
                }
            }
        };     
    },    
    linXx : function () {"use strict";
        return {
            axisLabel: "Реактивное сопротивление, Ом",
            color : "#11E",
            position: "right",
            tickFormatter : function formatter (val, axis) {
                if (Math.abs (val) < 1e3) {
                    return val.toFixed (axis.tickDecimals);
                } else if (Math.abs (val) < 1e6) {
                    return (val.toFixed (axis.tickDecimals) / 1e3).toString () + "к";
                } else {
                    return (val.toFixed (axis.tickDecimals) / 1e6).toString () + "М";
                }
            }
        };     
    },    
    linU : function () {"use strict";
        return {
            axisLabel: "Напряжение, В",
            color : "#000000",
            position: "left"
        };     
    },    
    linI : function () {"use strict";
        return {
            axisLabel: "Ток, мкА",
            color : "#000000",
            position: "right"
        };     
    },
    linR : function () {"use strict";
        return {
            axisLabel: "Активное сопротивление, Ом",
            color : "#000000",
            position: "left"
        };     
    },
    linX : function () {"use strict";
        return {
            axisLabel: "Реактивное сопротивление, Ом",
            color : "#000000",
            position: "right"
        };     
    },   
    dataA : function (array, label, index) {"use strict";
        if (index === undefined) {
            index = 1;
        }
    
        return {
            data : array,
            color : "#C22",
            label: label,
            yaxis : index,
            shadowSize : 0
        };
    },
    dataB : function (array, label, index) {"use strict";
        if (index === undefined) {
            index = 1;
        }

        return {
            data : array,
            color : "#22C",
            label: label,
            yaxis : index,
            shadowSize : 0
        };
    },
    dataC : function (array, label) {"use strict";
        return {
            data : array,
            color : "#111",
            label: label,
            shadowSize : 5
        };
    },
    
    band : function (f, flim) {"use strict";
        var fmin, fmax;

		if (f < 1e4) {
			fmin = 1e3;
			fmax = 1e4;
		} else if (f >= 1e4 && f < 1e5) {
			fmin = 1e4;
			fmax = 1e5;            
		} else if (f >= 1e5 && f < 5e5) {
			fmin = 1e5;
			fmax = 5e5;
		} else if (f >= 5e5 && f < 1.8e6) {
			fmin = 4e5;
			fmax = 2e6;
		} else if (f >= 1.8e6 && f < 5e6) {
			fmin = 1e6;
			fmax = 6e6;
		} else if (f >= 5e6 && f < 10e6) {
			fmin = 3e6;
			fmax = 15e6;
		} else if (f >= 10e6 && f < 20e6) {
			fmin = 10e6;
			fmax = 24e6;            
		} else if (f >= 20e6) {
			fmin = 15e6;
			fmax = 30e6;
		}
        
        if (flim !== undefined || isNaN (flim)) {
            fmax = Math.min (fmax, flim);
            fmax = Math.max (fmax, fmin);
            fmax = Math.round (fmax / fmin) * fmin;
            
            if (fmin === fmax || isNaN (fmax) || isNaN (fmin)) {
                fmin = f / (1 + 1 / 8);  
                fmax = f * (1 + 1 / 8);  
            }            
        } 
                       
        return [fmin, fmax];
    },
    
    impedanceResponseData : function (fnZ, ff, nsteps) {"use strict";
        var fmin = ff [0];
        var fmax = ff [1];
        
        var fdelta = (fmax - fmin) / nsteps;
        var R = [];
        var X = [];
        for (var freq = fmin; freq <= fmax; freq += fdelta) {
            var Z = fnZ (freq);
            R.push ([freq, Z.x]);
            X.push ([freq, Z.y]);
        }
        
        return [{
            data : R,
            color : "#111",
            yaxis : 1,
            shadowSize : 0,
            width: 2
         }, {
            data : X,
            color : "#11e",
            yaxis : 2,
            shadowSize : 0,
            width: 2
        }];
    },
    
    impedanceResponseAxes : function (ff) {"use strict";
        return {
            xaxis: Plots.linFx (ff [0], ff [1]),
            yaxes: [Plots.linRx (), Plots.linXx ()],
            series: {
                lines : {
                    lineWidth: 2
                }
            },
            grid: {
                backgroundColor: "#fff",
                borderWidth: 2,
                borderColor: "#555"
            }
        };
    },

    radiationPatternData : function (fnD, D) {"use strict";
        var F = [];
        for (var Theta = -90; Theta < 90; Theta += 0.1) {
            var phi = Theta / 180 * Math.PI;
            var rho = fnD (phi) / D;

            F.push ([rho * Math.sin (phi), rho * Math.cos (phi)]);
        }    
    
        return [{
            data : F, 
            label: "D=" + (10 * Math.log10 (D)).toPrecision (3) + " дБи",
            color : "#11F",
            shadowSize : 0
        }];
    },
    
    radiationPatternAxes: function () {"use strict";
        return {
            xaxis: {
                color : "#000",
                min : -1,
                max : 1,
                ticks : []
            },
            yaxis: {
                color : "#000",
                min : 0,
                max : 1, 
                ticks : []
            }
        };
    }
};

// XXX: align left & right axis