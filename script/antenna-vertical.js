/*jslint plusplus: true */
/*global Phys: true, Calc: true, Complex: true */
/*global IdealIsotropicRadiator: true, IdealMonopoleRadiator: true, MonopoleRadiator: true */
/*global Materials: true, Grounds: true, Plots: true */

function crystal () {"use strict";
    var antenna, antenna_power, antenna_impedance; 
      
    antenna = Calc.calc ({
        name: "antenna",
        input : {
            f : [1e3], 
            design : ["|", "/", "Г", "T", "U"],
            
            // leadin
            lead_h: [1e0],
                                   
            // curtain
            wire_design : [".", ":", ".:", "::", ".::", "*", "N", "_"],
            wire_material : ["Perfect", "Cu", "Cu+Sn", "Cu+Zn", "Al", "Zn", "Fe"], 
            wire_d : [1e-3],
            wire_s : [1e-3],
            wire_w : [1e-3],
            wire_D : [1e-3],
            wire_N : [],
           
            ground : [7, 4, 2, 0.5, 0]
        },
        output : {       
            lambda : [1e0, 3],
        //  wire_De : [1e-3, 2],
             
            W : [1e0, 2],
            W1 : [1e0, 2, "complex"],
            Z : [1e0, 2, "complex"],
            Z1 : [1e0, 2, "complex"],
            S : [1e0, 2, "exp"],

            lambda0 : [1e0, 3],
            f0 : [1e+6, 3],
            V : [1e0, 3],
            
            A : [1e0, 1],
            Rg : [1e0, 2],
            
            mu : [1e0, 1],
            g : [1e0, 2, "exp"],           
            R1 : [1e-3, 2],

         //   hg : [1e0, 2],
            D : [1e0, 2],
            eta : [1e-2, 2],
            G : [1e-1, 2],
        }
    }, function () {      
        var wires, designes, material, antenna, antennaAtLamda;
        
        // проверка входных значений
        this.check (this.f >= 1e5 && this.f <= 3e7, "f");
              
        // XXX ограничение на h, d
        
        // длина волны
        this.lambda = Phys.C / this.f;
             
        // @formatter:off
        // полотно
        // http://en.wikipedia.org/wiki/Antenna_equivalent_radius
        wires = {
            '.' : function () {
                // 1-wire
                this.wire_N = 1;
                this.wire_De = this.wire_d;            
            },
            ':' : function () {
                // 2-wires
                this.wire_N = 2;
                this.wire_De = 2 * Math.sqrt (this.wire_d / 2 * this.wire_s);            
            }, 
            '.:' : function () {
                // 3 wires
                this.wire_N = 3;
                this.wire_De = 2 * Math.pow (this.wire_d / 2 * Math.pow (this.wire_s, 2), 1 / 3);           
            }, 
            '::' : function () {
                // 4 wires
                this.wire_N = 4;
                this.wire_De = 2 * Math.pow (Math.SQRT2 * this.wire_d / 2 * Math.pow (this.wire_s, 3), 1 / 4);
            },
            '.::' : function () {
                // 5 wires
                this.wire_N = 5;
                this.wire_De = 2 * Math.pow (2.62 * this.wire_d / 2 * Math.pow (this.wire_s, 4), 1 / 5);
            }, 
            '*' : function () {
                // 6-wires
                this.wire_N = 6;
                this.wire_De = 2 * Math.pow (6 * this.wire_d / 2 * Math.pow (this.wire_s, 5), 1 / 6);
            }, 
            'N' : function () {
                // N-wires
                this.wire_De = 2 * Math.pow (this.wire_N * this.wire_d / 2, 1 / this.wire_N) * Math.pow (this.wire_D / 2, 1 - 1 / this.wire_N);
            }, 
            '_' : function () {
                // flat
                this.wire_N = 1;
                this.wire_De = 2 * this.wire_w * Math.exp (-3 / 2);
                this.wire_d = 2 * this.wire_w / Math.PI;
            }
        };
        
        wires [this.wire_design].call (this);            
        // @formatter:on
        
        this.check (this.lead_h > 0, "h");
        
        // конструкция 
        designes = {
            '|' : function () {
                this.h = this.lead_h;
            }      
        };
        
        designes [this.design].call (this);
        material = Materials [this.wire_material];
        this.g = material.g;
        this.mu = material.mu;
        this.A = this.ground;                       
        antenna = new MonopoleRadiator (this.h, this.wire_De, this.g, this.mu, this.A);
        antennaAtLamda = antenna.fn (this.lambda);
               
        this.S = this.lambda / this.wire_De;
        this.W = antennaAtLamda.W;
        this.ZS = antennaAtLamda.ZSn;
        this.Z = antennaAtLamda.Z;
        this.Z1 = antennaAtLamda.Z1;
        this.W1 = antennaAtLamda.W1;
        this.R1 = antennaAtLamda.R1;
        this.Rg = antennaAtLamda.Rg;  
        
        this.eta = antennaAtLamda.eta;
        this.D = antennaAtLamda.D;
        this.G = Math.log10 (this.D * this.eta);   
        
        this.f0 = antennaAtLamda.f0;
        this.lambda0 = antennaAtLamda.lambda0;
        this.V = (4 * this.h) / this.lambda0;
        
        this.fnZ = function (lambda) {
            return antenna.fn (lambda).Z;
        };
 
        var F, Theta, phi, rho;        
        F = [];
        for (Theta = -90; Theta < 90; Theta += 0.1) {
            phi = Theta / 180 * Math.PI;
            rho = antennaAtLamda.fnD (phi) / antennaAtLamda.D;

            F.push ([rho * Math.sin (phi), rho * Math.cos (phi)]);
        }
             
        this.plot (
            [{
                data : F, 
                label: "D=" + (10 * Math.log10 (antennaAtLamda.D)).toPrecision (3) + " дБи",
                color : "#00F", 
                shadowSize : 0
            }], {
                xaxis: {
                    color : "#000000",
                    min : -1,
                    max : 1,
                    ticks : []
                },
            
                yaxis: {
                    color : "#000000",
                    min : 0,
                    max : 1, 
                    ticks : []
                }
                },
            0);
    });
    
    antenna_power = Calc.calc ({
        name: "antenna-power",
        input : {
            E : [1e-3], 
            lambda : antenna.lambda,
            D : antenna.D,
            eta : antenna.eta,
            Z : antenna.Z
        },
        output : {       
            Ea : [1e-3, 2],
            P : [1e0, 1, "exp"]
        }
    }, function () {            
        this.check (this.E <= 100, "E");    
        // э.д.с. эквивалентного генератора
        // вектор E считаем перпендикулярным земной поверхности
        // FIXME: обоснование 4
        this.Ea = this.E * this.lambda * Math.sqrt (this.D * this.eta * this.Z.x / (4 * Phys.Z0 * Math.PI));
        this.P = Math.pow (this.Ea, 2) / (4 * this.Z.x);
    });        
    
    // TODO: Учет диаграммы направленности
    antenna_impedance = Calc.calc ({
        name: "antenna-impedance",
        input : {
            band : ["LW", "LW+MW", "MW", "MW+SW1", "SW1", "SW1+SW2", "SW2"],
            antennaZ : antenna.fnZ
        },
        output : {       
        }
    }, function () {      
        var R, X, freq, Z, fmin, fmax, fdelta, bands;
        R = [];
        X = [];

        bands = {
            'LW' : {
                fmin: 100e3,
                fmax: 300e3
            },
            'LW+MW' : {
                fmin: 100e3,
                fmax: 2000e3
            },
            'MW' : {
                fmin: 500e3,
                fmax: 2000e3
            },
            'MW+SW1' : {
                fmin: 500e3,
                fmax: 10000e3
            },
            'SW1' : {
                fmin: 3e6,
                fmax: 10e6
            },
            'SW1+SW2' : {
                fmin: 3e6,
                fmax: 30e6
            },
            'SW2' : {
                fmin: 10e6,
                fmax: 30e6
            },           
        };
              
        fmin = bands [this.band].fmin;
        fmax = bands [this.band].fmax;
        fdelta = (fmax - fmin) / 100.0;
         
        for (freq = fmin; freq <= fmax; freq += fdelta) {
            Z = this.antennaZ (Phys.C / freq);
            R.push ([freq, Z.x]);
            X.push ([freq, Z.y]);
        }     
              
        var options1;
        options1 = {           
            xaxis: Plots.linFx (fmin, fmax),
            yaxes: [Plots.linRx (), Plots.linXx ()],
            legend: {
                show: true,
                noColumns : 2,
                position: "nw"
            }
        };
    
        this.plot ([
            Plots.dataC (R,  "R", 1),
            Plots.dataB (X, "jX", 2) 
        ], options1);
    });
}

$ (document).ready (function () {"use strict";
    Calc.init (crystal);
});
