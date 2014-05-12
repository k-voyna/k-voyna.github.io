/*jslint plusplus: true */
/*global Phys: true, Calc: true, Complex: true */
/*global MagneticLoop: true */
/*global Materials: true, Plots: true */

function crystal () {"use strict";
    var antenna, antenna_power, antenna_impedance; 
  
    antenna = Calc.calc ({
        name: "antenna_loop",
        input : {
            f : [1e3],
            d : [1e0],
            s : [1e0],
            w : [1e0],
            h : [1e0],
            N : [],
            design: ["O", "[]", "[ ]"],
            wire_d : [1e-3],
            E : [1e-3],
            Ctype : ["A12-495x1", "A12-495x2", "A12-495x3", "A12-365x1", "A12-365x2", "A12-365x3", "S5-270x1", "S5-270x2", "S5-180x1", "S5-180x2"],
            R : [1e3],
            material : ["Cu", "Al"],
            Cx : [1e-12]
        },
        output : {           
            // part 1
            lambda : [1e+0, 3],
            mu : [1e0, 1],
            g : [1e0, 2, "exp"],            
            l : [1e0, 2],
            p : [1e0, 2],
            S : [1e0, 2],

            D : [1e0, 2],
            G : [1e-1, 2],
            hg : [1e0, 2],
            RS : [1e0, 2, "exp"],
            R1 : [1e0, 2],
            Rl : [1e0, 2],
            Qa : [1e0, 2],
            C : [1e-12, 2],
            eta : [1e0, 2, "exp"],   
            Za : [1e0, 2, "complex"],
            
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
        var antennaAtLambda, material;
    
        this.check (this.f >= 1e5 && this.f <= 30e6, "f");
        this.check (this.E <= 10 && this.E > 0, "E");
        
        this.check ((this.w > this.h && this.w / this.h <= 4) || (this.h > this.w && this.h / this.w <= 4) || (this.h == this.w), "wh");
        
        this.check (this.R > 0, "R");
        this.check (this.N > 0, "N");
        this.check (this.wire_d > 0, "wire_d");
           
        this.lambda = Phys.C / this.f;
    
        // характеристики материала проводника
        material = Materials [this.material];
        this.g = material.g;
        this.mu = material.mu;
        
        // непосредственно рамка
        if (this.design === "O") {
        	this.check (this.d > 0, "d");
        	
            this.S = Math.PI * Math.pow (this.d / 2, 2);
            this.p = Math.PI * this.d;
        } else if (this.design === "[]") {
			this.check (this.s > 0, "s");
			
            this.S = Math.pow (this.s, 2);
            this.p = this.s * 4;
        } else {
        	this.check (this.w > 0, "w");
			this.check (this.h > 0, "h");
			
            this.S = this.h * this.w;
            this.p = (this.h + this.w) * 2;
        }
       
        this.check (this.wire_d <= this.p / 20, "wire_d");        
        this.l = this.p * this.N;
        
        // ограничение на периметр 0,14 lambda (Кочержевский)
        this.check (this.p <= this.lambda * 0.14, "p");
        this.check (this.l <= this.lambda / 6, "l");
        
        this.hg = 2 * Math.PI * this.N * this.S / this.lambda;
        
        this.antenna = new MagneticLoop (this.S, this.p, this.l, this.wire_d, this.N, this.g, this.mu);
        
        antennaAtLambda = this.antenna.fn (this.lambda);
        
        this.R1 = antennaAtLambda.R1;
        this.eta = antennaAtLambda.eta;
        this.RS = antennaAtLambda.RS;
        this.Rl = antennaAtLambda.Rl;
        this.Za = antennaAtLambda.Z;
        this.D = antennaAtLambda.D;  

        this.omega = 2 * Math.PI * this.f;        
        this.C = 1 / (this.omega * this.Za.y);
        this.Qa = Math.abs (this.Za.y) / this.Za.x;
        
        // http://www.chipinfo.ru/literature/radio/200404/p67.html
        // this.Q = 3 * Math.log (this.d / this.wire_d) * Math.pow (this.lambda / this.p, 3) / Math.PI * this.eta;        
        this.G = Math.log10 (this.D * this.eta);

        // TODO: Собственная емкость и индуктивность
        
        // -------------------------------------------------------
        var capacitor;
        capacitor = Capacitors [this.Ctype];
        
        this.Ea = antennaAtLambda.fnE (this.E);
        this.Cmin = capacitor.Cmin * capacitor.N + this.Cx;
        this.Cmax = capacitor.Cmax * capacitor.N + this.Cx;
        this.QC = capacitor.Q;
        this.Ct = this.C - this.Cx;
        
        this.check (this.C >= this.Cmin, "Cmin");
        this.check (this.C <= this.Cmax, "Cmax");
        this.check (this.Cx >= 0, "Cx");
       
        this.fnCircuit = function (f, R) {
            var result, antenna;
            result = [];
            antenna = this.antenna.fn (Phys.C / f);
            
            result.zC = Phys.fnCapacitor (f, this.C, this.QC).Z;
            result.zRC = result.zC.par (new Complex (R, 0));
            result.z = antenna.Z.sum (result.zRC);
            result.fnU = function (E) {
                return new Complex (antenna.fnE (E), 0).div (result.z).mul (result.zRC);
            };
            
            return result;
        };

        var p0 = Math.pow (this.lambda * this.E / (2 * Math.PI), 2) / (4 * Phys.Z0 / Math.PI);
        var circuit = this.fnCircuit (this.f, this.R);
               
        this.Ee = this.fnCircuit (this.f, 1e12).fnU (this.E).mod ();
        this.rC = circuit.zC.x;
        this.Qn = -circuit.zC.y / circuit.z.x;
        this.dF = this.f / this.Qn;
        this.Un = circuit.fnU (this.E).mod ();
        this.Rn = this.Za.par (circuit.zC).mod ();
        this.Pn  = this.Un * this.Un / this.R;
        this.etaF = this.RS / (this.rC +  this.Za.x);
        this.KU = Math.log10 (this.Pn / p0);
              
        var options1;
        options1 = {
            series: {
                lines: { 
                    show: true,
                    lineWidth: 2,
                    zero: false 
                }
            },
            
            xaxis: Plots.linFx (),
            yaxes: [Plots.logDB ()],
            legend: {
                show: true,
                noColumns : 2,
                position: "ne"
            }
        };
                   
        var U, freq, fmin, fmax;
                
        U = [];
        
        if (this.f < 2e6) {
            fmin = 1e5;
            fmax = 2e6;
        } else if (this.f > 2e6 && this.f < 3e6) {
            fmin = 2e6;
            fmax = 10e6;
        } else if (this.f >= 3e6 && this.f <= 10e6) {
            fmin = 3e6;
            fmax = 15e6;
        } else if (this.f > 10e6) {
            fmin = 10e6;
            fmax = 30e6;
        }
        
        // ограничиваем fmax по условиям lambda (f) > l / 6
        fmax = Math.min (Phys.C / (this.l * 6), fmax);

        if (fmax > fmin && fmax > 1e6) {
            for (freq = fmin; freq <= fmax; freq += (fmax - fmin) / 200) {
            	var p0 = Math.pow (Phys.C / freq * this.E / (2 * Math.PI), 2) / (4 * Phys.Z0 / Math.PI);
                var circuit = this.fnCircuit (freq, this.R);
                var p = Math.pow (circuit.fnU (this.E).mod (), 2) / this.R;
                U.push ([freq, 10 * Math.log10 (p / p0)]);
            }
            
            this.plot ([
                Plots.dataC (U, "", 1)
            ], options1, 0);
        }
    });    
}

$ (document).ready (function () {"use strict";
    Calc.init (crystal);
});
