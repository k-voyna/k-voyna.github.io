/*jslint plusplus: true */
/*global Phys: true, Calc: true, Complex: true */
/*global MagneticLoop: true */
/*global Materials: true, Plots: true */

function crystal () {"use strict"; 
    var antenna = Calc.calc ({
        name: "antenna_loop",
        input : {
            f : [1e3],
            d : [1e0],
            s : [1e0],
            w : [1e0],
            b : [1e-3],
            h : [1e0],
            N : [],
            design: ["O", "[]", "[ ]", "[N]"],
            wire_d : [1e-3],
            material : ["Perfect", "Cu", "Al"]
        },
        output : {           
            // part 1
            lambda : [1e+0, 3],
            mu : [1e0, 1],
            g : [1e0, 2, "exp"],            
            l : [1e0, 2],
            ll : [1e0, 2],
            ll0 : [1e0, 2],
            p : [1e0, 2],
            pl : [1e0, 2],
            S : [1e0, 2],
            
            W : [1e0, 2],

            D : [1e0, 2],
            G : [1e-1, 2],
            hg : [1e0, 2],
            RS : [1e0, 2, "exp"],
            R1 : [1e0, 2],
            Rl : [1e0, 2],
            Qa : [1e0, 2],
            C : [1e-12, 2],
            C0 : [1e-12, 2],
            L0 : [1e-6, 2],
            eta : [1e0, 2, "exp"],   
            Za : [1e0, 2, "complex"],
            f0 : [1e6, 2],
            lambda0 : [1e0, 2]
        }
    }, function () {   
        var KWH = 10;
        var KL = 0.14;
    
        this.check (this.f >= 1e3 && this.f <= 30e6, "f");        
        this.check ((this.w > this.h && this.w / this.h <= KWH) || (this.h > this.w && this.h / this.w <= KWH) || (this.h == this.w), "wh");
        this.check (this.wire_d > 0, "wire_d");
           
        this.lambda = Phys.C / this.f;
    
        // характеристики материала проводника
        var material = Materials [this.material];
        this.g = material.g;
        this.mu = material.mu;
        
        // непосредственно рамка
        if (this.design === "O") {
        	this.check (this.d > 0, "d");
        	
            this.S = Math.PI * Math.pow (this.d / 2, 2);
            this.p = Math.PI * this.d;
            this.w = 0;
            this.h = 0;
            this.N = 1;
        } else if (this.design === "[]") {
			this.check (this.s > 0, "s");
			
            this.S = Math.pow (this.s, 2);
            this.p = this.s * 4;
            this.w = this.s;
            this.h = this.s;
            this.d = 0;
            this.N = 1;
        } else if (this.design === "[N]") {
            this.check (this.N >= 2 && this.N <= 60, "N");
            this.check (this.b >= 5 * this.wire_d && this.b <= this.s / (5 * this.N), "b");
            this.check (this.s > 0, "s");
                     
            this.S = Math.pow (this.s, 2);
            this.p = this.s * 4;
            this.w = this.s;
            this.h = this.s;
            this.d = 0;
        } else {
        	this.check (this.w > 0, "w");
			this.check (this.h > 0, "h");
			
            this.S = this.h * this.w;
            this.p = (this.h + this.w) * 2;
            this.d = 0;
            this.N = 1;
        }
       
        var antenna = new MagneticLoop (this.d, this.w, this.h, this.wire_d, this.b, this.N, this.g, this.mu);
        this.antenna = antenna;
        
        var antennaAtLambda = this.antenna.fn (this.lambda);
        this.antennaAtLambda = antennaAtLambda;
        
        this.R1 = antennaAtLambda.R1;
        this.eta = antennaAtLambda.eta;
        this.RS = antennaAtLambda.RS;
        this.Rl = antennaAtLambda.Rl;
        this.Za = antennaAtLambda.Z;
        this.hg = antennaAtLambda.lg;
        this.D = antennaAtLambda.D;  
        this.W = antennaAtLambda.W;  
        this.Qa = antennaAtLambda.Q;
        this.S = antennaAtLambda.S;
        this.p = antennaAtLambda.p;
        this.l = antennaAtLambda.l;
        this.ll = this.l / this.lambda;
        this.pl = this.p / this.lambda;
        this.f0 = antennaAtLambda.f0;
        this.C0 = antennaAtLambda.C0;
        this.L0 = antennaAtLambda.L0;
        this.lambda0 = antennaAtLambda.lambda0;
        this.ll0 = this.lambda / this.lambda0;

        // ограничение на периметр 0,14 lambda (Кочержевский)
        this.suggest (this.p <= this.lambda * KL, "pL");       
        this.suggest (!isNaN (this.f0), "f0"); 

        this.check (this.l <= this.lambda * KL || this.N === 1, "lL");
        this.check (this.p <= this.lambda, "pl"); 
        this.check (this.wire_d <= this.p / 20, "wire_d");        
        
        // http://www.chipinfo.ru/literature/radio/200404/p67.html
        // this.Q = 3 * Math.log (this.d / this.wire_d) * Math.pow (this.lambda / this.p, 3) / Math.PI * this.eta;        
        this.G = Math.log10 (this.D * this.eta);

        // fmax ограничиваем l = 0.14 * lambda
        this.band = Plots.band (this.f, KL * Phys.C / this.l);
        this.fnZ = function (freq) {
            return antenna.fn (Phys.C / freq).Z;
        };
        
        this.plot (Plots.impedanceResponseData (this.fnZ, this.band, 200), Plots.impedanceResponseAxes (this.band), 0);
    });
   
    var circuit = Calc.calc ({
        name: "circuit",
        input : {
            E : [1e-3],
            Ctype : ["A12-495x1", "A12-495x2", "A12-495x3", "A12-365x1", "A12-365x2", "A12-365x3", 
                     "A4-15x1", "A4-15x2", 
                     "S5-270x1", "S5-270x2", "S5-180x1", "S5-180x2"],
            R : [1e3],
            Cx : [1e-12],
            f : antenna.f
        },
        output : {           
            C : [1e-12, 2],
            
            // part 2
            Pn : [1e0, 1, "exp"],
            Ea : [1e-3, 2],
            Ee : [1e-3, 2],
            Cmin : [1e-12, 2],
            Cmax : [1e-12, 2],
            Ct : [1e-12, 2],
            QC : [1e0, 3],
            rC : [1e0, 2],
            etaF : [1e0, 2, "exp"],
            Rn : [1e3, 2],
            KU : [1e-1, 2],
            Un : [1e-3, 2],
            Qn : [1e0, 2],
            dF : [1e3, 2]
        }
    }, function () {  
        this.check (this.E <= 10 && this.E > 0, "E");      
        this.check (this.R > 0, "R");
    
        // -------------------------------------------------------
        var capacitor = Capacitors [this.Ctype];
              
        this.Ea = antenna.antennaAtLambda.fnE (this.E);
        this.QC = capacitor.Q;
               
        this.C = 1 / (2 * Math.PI * this.f * antenna.antennaAtLambda.Z.y);        
        this.check (this.C >= 0, "C");
        this.C = this.C < 0 ? 0 : this.C;
        
        this.check (this.Cx >= 0, "Cx");        
        this.Ct = this.C - this.Cx;

        this.Cmin = capacitor.Cmin * capacitor.N + this.Cx;
        this.Cmax = capacitor.Cmax * capacitor.N + this.Cx;
        this.check (this.C >= this.Cmin, "Cmin");
        this.check (this.C <= this.Cmax, "Cmax");
        
        this.Ct = Math.clamp (this.Ct, this.Cmin - this.Cx, this.Cmax - this.Cx);
        this.CC = this.Ct + this.Cx;
        
        function fnCircuit (f, aerial, C, QC, R) {
            var result = [];
            
            result.zC = Phys.fnCapacitor (f, C, QC).Z;
            result.zRC = result.zC.par (new Complex (R, 0));
            result.z = aerial.Z.sum (result.zRC);
            result.fnU = function (E) {
                return new Complex (aerial.fnE (E), 0).div (result.z).mul (result.zRC);
            };
            
            return result;
        };

        this.fnCircuit = function (f) {
            var aerial = antenna.antenna.fn (Phys.C / f);
            return {
                x : fnCircuit (f, aerial, this.CC, this.QC, this.R),
                min : fnCircuit (f, aerial, this.Cmax, this.QC, this.R),
                max : fnCircuit (f, aerial, this.Cmin, this.QC, this.R)
            };
        };        
        
        var p0 = Math.pow (antenna.lambda * this.E / (2 * Math.PI), 2) / (4 * Phys.Z0 / Math.PI);
        var circuit = fnCircuit (this.f, antenna.antennaAtLambda, this.CC, this.QC, this.R);
                      
        this.Ee = fnCircuit (this.f, antenna.antennaAtLambda, this.CC, this.QC, 1e12).fnU (this.E).mod ();
        this.rC = circuit.zC.x;
        // TODO: Точный расчет
        this.Qn = -circuit.zC.y / circuit.z.x;
        this.dF = this.f / this.Qn;
        this.Un = circuit.fnU (this.E).mod ();
        this.Rn = antenna.Za.par (circuit.zC).mod ();
        this.Pn  = this.Un * this.Un / this.R;
        this.etaF = this.RS / (this.rC + antenna.Za.x);
        this.KU = Math.log10 (this.Pn / p0);
              
        var Ux = [];
        var Umin = [];
        var Umax = [];
        
        var fmin = antenna.band [0];
        var fmax = antenna.band [1];

        if (fmax > fmin) {
            for (var freq = fmin; freq <= fmax; freq += (fmax - fmin) / 200) {
            	var p0 = Math.pow (Phys.C / freq * this.E / (2 * Math.PI), 2) / (4 * Phys.Z0 / Math.PI);

                var circuit = this.fnCircuit (freq);
                
				var px   = Math.pow (circuit.x.fnU (this.E).mod (), 2) / this.R;
				var pmin = Math.pow (circuit.min.fnU (this.E).mod (), 2) / this.R;
				var pmax = Math.pow (circuit.max.fnU (this.E).mod (), 2) / this.R;
                
				Ux.push   ( [freq, 10 * Math.log10 (px   / p0)]);
				Umin.push ( [freq, 10 * Math.log10 (pmin / p0)]);
				Umax.push ( [freq, 10 * Math.log10 (pmax / p0)]);                
            }
            
			var options1;
			options1 = {
				series : {
					lines : {
						show : true,
						lineWidth : 2,
						zero : false
					}
				},

				xaxis : Plots.linFx (),
				yaxes : [Plots.logDB ()],
				legend : {
					show : true,
					noColumns : 1,
					position : "se"
				}
			};

			this.plot ( [{
				data : Ux,
				color : "#030",
				label : "При настройке на расчетную частоту",
				shadowSize : 0
			}, {
				data : Umin,
				color : "#F00",
				label : "При максимальной ёмкости КПЕ",
				shadowSize : 0
			}, {
				data : Umax,
				color : "#00F",
				label : "При минимальной ёмкости КПЕ",
				shadowSize : 0
			}], options1, 0);
        }       
    });
}

$ (document).ready (function () {"use strict";
    Calc.init (crystal);
});
