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
           
            ground_a : [1e-3],
            ground_l : [1e-2],
            ground_s : [1e-2],
            ground_type : ['polar ice', 'sandy soil', 'dry soil', 'wet soil', 'fresh water', 'sea water'],
            ground_system : ['_', '|', 'O'],
            ground_material : ["Perfect", "Cu", "Cu+Sn", "Al", "Zn"], 
            ground_n : [],
            ground_rho : [1e-3],
            ground_A : [1e0]
        },
        output : {       
            lambda : [1e0, 3],
            wire_De : [1e-3, 2],
             
            Ca: [1e-12, 2],
            La: [1e-6, 2],
             
            W : [1e0, 2],
            W1 : [1e0, 2, "complex"],
            Z : [1e0, 2, "complex"],
            Z1 : [1e0, 2, "complex"],
            S : [1e0, 2, "exp"],

            lambda0 : [1e0, 3],
            f0 : [1e+6, 3],
            V : [1e0, 3],
            
            sigma : [1e+0, 1, "exp"],
            eps : [1e+0, 1],
            Rg : [1e0, 2],
            Rgn : [1e0, 2, "complex"],
            Sg : [1e0, 2],

            RS : [1e0, 2],
            
            mu : [1e0, 1],
            g : [1e0, 2, "exp"],           
            R1 : [1e-3, 2],

            D : [1e0, 2],
            eta : [1e-2, 2],
            G : [1e-1, 2]
        }
    }, function () {       
        // проверки
        this.check (this.f >= 1e3 && this.f <= 3e7, "f");
               
        // длина волны
        this.lambda = Phys.C / this.f;

        this.h = this.lead_h;
        
        // проверка высоты
        this.check (this.lead_h > 0 && this.lead_h < this.lambda * 0.75, "lead_h");
        
        var KDLAMBDA = 0.005; // максимальное утолщение по диаметру
        var KDEH = 0.03; // максимальное утолщение по эквивалентному диаметру
        var KSH = 0.02;  // максимальное отношения расстояния между проводниками полотна к длине полотна
        
        // ka < 0.05; a < 0.05l / 2PI; KDLAMBDA = 
        
        // @formatter:off
        // полотно
        // http://en.wikipedia.org/wiki/Antenna_equivalent_radius
        var wires = {
            '.' : function () {
                // 1-wire
                this.wire_N = 1;
                this.wire_De = this.wire_d;
                this.check (this.wire_d >= 0.1e-3 && this.wire_d < KDLAMBDA * this.lambda, "wire_d");  
                this.check (this.lambda / this.wire_De > 1e3, "wire_d");                
            },
            ':' : function () {
                // 2-wires
                this.wire_N = 2;
                this.wire_De = 2 * Math.sqrt (this.wire_d / 2 * this.wire_s);
                
                this.check (this.wire_d >= 0.1e-3 && this.wire_d < KDLAMBDA * this.lambda, "wire_d");  
                this.check (this.wire_s >= this.wire_d * 2 && this.wire_s <= KSH * this.lead_h, "wire_s");
            }, 
            '.:' : function () {
                // 3 wires
                this.wire_N = 3;
                this.wire_De = 2 * Math.pow (this.wire_d / 2 * Math.pow (this.wire_s, 2), 1 / 3);           
                
                this.check (this.wire_d >= 0.1e-3 && this.wire_d < KDLAMBDA * this.lambda, "wire_d");  
                this.check (this.wire_s >= this.wire_d * 2 && this.wire_s <= KSH * this.lead_h, "wire_s");
            }, 
            '::' : function () {
                // 4 wires
                this.wire_N = 4;
                this.wire_De = 2 * Math.pow (Math.SQRT2 * this.wire_d / 2 * Math.pow (this.wire_s, 3), 1 / 4);
                
                this.check (this.wire_d >= 0.1e-3 && this.wire_d < KDLAMBDA * this.lambda, "wire_d");  
                this.check (this.wire_s >= this.wire_d * 2 && this.wire_s <= KSH * this.lead_h, "wire_s");
            },
            '.::' : function () {
                // 5 wires
                this.wire_N = 5;
                this.wire_De = 2 * Math.pow (2.62 * this.wire_d / 2 * Math.pow (this.wire_s, 4), 1 / 5);
                
                this.check (this.wire_d >= 0.1e-3 && this.wire_d < KDLAMBDA * this.lambda, "wire_d");  
                this.check (this.wire_s >= this.wire_d * 2 && this.wire_s <= KSH * this.lead_h, "wire_s");
            }, 
            '*' : function () {
                // 6-wires
                this.wire_N = 6;
                this.wire_De = 2 * Math.pow (6 * this.wire_d / 2 * Math.pow (this.wire_s, 5), 1 / 6);
                
                this.check (this.wire_d >= 0.1e-3, "wire_d");                
                this.check (this.wire_s >= this.wire_d * 2 && this.wire_s <= KSH * this.lead_h, "wire_s");
            }, 
            'N' : function () {
                // N-wires
                this.wire_De = 2 * Math.pow (this.wire_N * this.wire_d / 2, 1 / this.wire_N) * Math.pow (this.wire_D / 2, 1 - 1 / this.wire_N);
                this.wire_s = this.wire_D * Math.PI / this.wire_N;
                
                this.check (this.wire_N >= 6, "wire_N");
                this.check (this.wire_d >= 0.1e-3 && this.wire_d < KDLAMBDA * this.lambda, "wire_d"); 
                this.check (this.wire_s > 2 * this.wire_d, "wire_D");
                this.check (this.wire_s <= KSH * this.lead_h, "wire_D1");
            }, 
            '_' : function () {
                // flat
                this.wire_N = 1;
                this.wire_De = 2 * this.wire_w * Math.exp (-3 / 2);
                this.wire_d = 2 * this.wire_w / Math.PI;
                
                this.check (this.wire_w >= 1e-3 && this.wire_w < KDLAMBDA * this.lambda, "wire_w");
            }
        };
        
        wires [this.wire_design].call (this);            
        // @formatter:on

        this.check (this.wire_De <= KDEH * this.lead_h, "geometry");
        
        // конструкция 
        var material = Materials [this.wire_material];
        this.g = material.g;
        this.mu = material.mu;

        var groundE = Grounds [this.ground_type];           
        this.sigma = groundE.sigma;
        this.eps = groundE.eps;
            
        // XXX: проверка граничных условий по lambda и толщине
        
        var ground;
        if (this.ground_system === '_') {
            ground = new IdealGround ();
        } else if (this.ground_system === '|') {
            this.check (this.ground_a >= 0.001, "ground_a");
            this.check (this.ground_l >= 0.05 && this.ground_l <= 3, "ground_l");

            ground = new StiftGround (this.h, this.sigma, this.eps, this.ground_a, this.ground_l);
        } else {
            this.check (this.ground_s >= 0.05 && this.ground_s <= 3, "ground_s");
            this.check (this.ground_A >= 1.0, "ground_A");
            this.check (this.ground_rho >= 0.0001 && this.ground_rho <= this.ground_A / 10, "ground_rho1");
            this.check (this.ground_rho < this.ground_s, "ground_rho2");
            this.check (this.ground_n > 0, "ground_n");
        
            var gm = Materials [this.ground_material];       
            ground = new RadialGround (this.h, this.sigma, this.eps, this.ground_s, this.ground_A, this.ground_rho, this.ground_n, gm.g);
        }

        var antenna = new MonopoleRadiator (this.h, this.wire_De, this.wire_d, this.wire_N, this.g, this.mu, ground);
        var antennaAtLamda = antenna.fn (this.lambda);
               
        this.S = this.lambda / this.wire_De;

        this.W = antennaAtLamda.W;
        this.ZS = antennaAtLamda.ZSn;
        this.Z = antennaAtLamda.Z;
        this.Z1 = antennaAtLamda.Z1;
        this.W1 = antennaAtLamda.W1;
        this.R1 = antennaAtLamda.R1;
        this.Sg = antennaAtLamda.Sg;
        this.Rg = antennaAtLamda.Rg;
        this.RS = antennaAtLamda.RS;
        this.Rgn = antennaAtLamda.Zgn;
        
        this.eta = antennaAtLamda.eta;
        this.D = antennaAtLamda.D;
        this.G = Math.log10 (this.D * this.eta);   
        
        this.f0 = antennaAtLamda.f0;
        this.lambda0 = antennaAtLamda.lambda0;
        this.V = (4 * this.h) / this.lambda0;
        
        this.fnZ = function (lambda) {
            return antenna.fn (lambda).Z;
        };
 
 		this.Ca = antennaAtLamda.C;
		this.La = antennaAtLamda.L;
 
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
            
        var R, X, freq, Z, fmin, fmax, fdelta, bands;
        R = [];
        X = [];

		if (this.f < 1e4) {
			fmin = 1e3;
			fmax = 1e4;
		} else if (this.f >= 1e4 && this.f < 1e5) {
			fmin = 1e4;
			fmax = 1e5;            
		} else if (this.f >= 1e5 && this.f < 5e5) {
			fmin = 1e5;
			fmax = 5e5;
		} else if (this.f >= 5e5 && this.f < 1.8e6) {
			fmin = 4e5;
			fmax = 2e6;
		} else if (this.f >= 1.8e6 && this.f < 5e6) {
			fmin = 1e6;
			fmax = 6e6;
		} else if (this.f >= 5e6 && this.f < 10e6) {
			fmin = 3e6;
			fmax = 15e6;
		} else if (this.f >= 10e6 && this.f < 20e6) {
			fmin = 10e6;
			fmax = 24e6;            
		} else if (this.f >= 20e6) {
			fmin = 15e6;
			fmax = 30e6;
		}
              
        fdelta = (fmax - fmin) / 100.0;
         
        for (freq = fmin; freq <= fmax; freq += fdelta) {
            Z = this.fnZ (Phys.C / freq);
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
        ], options1, 1);            
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
            P : [1e0, 2, "exp"],
            Z : [1e0, 2, "complex"],
        }
    }, function () {   
        this.check (this.E <= 100 && this.E > 0, "E");    
        // э.д.с. эквивалентного генератора
        // вектор E считаем перпендикулярным земной поверхности
        // FIXME: обоснование 4
        // this.Ea = this.E * this.lambda * Math.sqrt (this.D * this.eta * this.Z.x / (4 * Phys.Z0 * Math.PI));
//        this.P = Math.pow (this.Ea, 2) / (4 * this.Z.x);
        
        this.P = Math.pow (this.E * this.lambda / (2.0 * Math.PI), 2) * (this.D * this.eta) / (4 * Phys.Z0 / Math.PI);
        this.Ea = Math.sqrt (4 * this.P * this.Z.x);
    });        
    
    // TODO: Учет диаграммы направленности
}

$ (document).ready (function () {"use strict";
    Calc.init (crystal);
});
