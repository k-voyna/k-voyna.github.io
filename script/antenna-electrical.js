/*jslint plusplus: true */
/*global Phys: true, Calc: true, Complex: true */
/*global LongWire: true */
/*global Materials: true, Grounds: true, Plots: true */
/*global Conductor: true, Capacitor: true */

function crystal () {"use strict";
    var KDH = 0.03; // максимальное утолщение по диаметру
    var KHMAX = 2/3;
    var KBMAX = 0.4;
    var KHEMAX = 0.45;

	var antenna = Calc.calc ({
		name : "antenna-electrical",
		input : {
			// freq
			f : [1e3],

			// design
			design : ["|", "/", "Г", "Т"],
			lead_h : [1e0],
			lead_l : [1e0],
			beam_length : [1e0],

			// curtain
			wire_design : ".", //[".", ":", ".:", "::", ".::", "*", "N", "_"],
			wire_material : ["Perfect", "Cu", "Cu+Sn", "Cu+Zn", "Al", "Zn", "Fe"],
			wire_d : [1e-3],
			wire_s : [1e-3],
			wire_w : [1e-3],
			wire_D : [1e-3],
			wire_N : [],

			// ground
            ground_a : [1e-3],
            ground_l : [1e-2],
            ground_s : [1e-2],
            ground_type : ['polar ice', 'sandy soil', 'dry soil', 'wet soil', 'fresh water', 'sea water'],
            ground_system : ['_', '|', 'O'],
            ground_n : [],
            ground_rho : [1e-3],
            ground_A : [1e0]
		},
		output : {
			lambda : [1e0, 3],

			wire_De : [1e-3, 2],
			W : [1e0, 2],
			Wb : [1e0, 2],

			lambda0 : [1e0, 3],
			f0 : [1e+6, 3],
			k : [1e0, 3],

			mu : [1e0, 1],
			g : [1e0, 2, "exp"],
			R1 : [1e-3, 2],

			be : [1e0, 2],
			he : [1e0, 2],
            psi : [1e0, 2],
            phi : [1e0, 2],
            
			hg : [1e0, 2],
            RS : [1e0, 2],

			D : [1e0, 2],
			eta : [1e-2, 2],
			G : [1e-1, 2],
            
            sigma : [1e+0, 1, "exp"],
            eps : [1e+0, 1],
            Rg : [1e0, 2],
            Sg : [1e0, 2],            

			Za : [1e0, 2, "complex"],
			La : [1e-6, 2],
			Ca : [1e-12, 2]
		}
	}, function () {
		// длина волны
		this.check (this.f >= 1e3 && this.f <= 3e7, "f");
		this.lambda = Phys.C / this.f;

		// @formatter:off
		// полотно
		// http://en.wikipedia.org/wiki/Antenna_equivalent_radius
		var wires = {
			'.' : function () {
				// 1-wire
				this.wire_N = 1;
				this.wire_De = this.wire_d;

				this.check (this.wire_d > 0 && this.wire_d < this.lambda * 5e-3, "d");
                // FIXME: this.check (this.lambda / this.wire_d > 1e3, "wire_d"); 
                // FIXME: this.check (this.wire_d <= KDH * this.lead_h, "geometry");                
			}
		};

		wires [this.wire_design].call (this);
		// @formatter:on
       
		// конструкция                       
		var designes = {
			'|' : function () {
				this.bf = 0;
				this.h = this.lead_h;
				this.l = this.lead_h;
				this.nb = 1;
				this.b = 0;

				this.check (this.lead_h > 0 && this.lead_h < this.lambda * KHMAX, "lead_h");
			},
			'/' : function () {
				this.bf = 0;
				this.h = this.lead_h;
				this.l = this.lead_l;
				this.nb = 1;
				this.b = 0;

				this.check (this.lead_h > 0 && this.lead_h < this.lambda * KHMAX, "lead_h");
				this.check (this.lead_l >= this.lead_h, "lead_l");
			},
			'Г' : function () {
				this.h = this.lead_h;
				this.l = this.lead_h;
				this.nb = 1;
				this.b = this.beam_length;
				this.bf = 0;
				// this.beam_slope;

				this.check (this.lead_h > 0 && this.lead_h < this.lambda * KHMAX, "lead_h");
				this.check (this.beam_length > 0 && this.beam_length < this.lambda * KBMAX, "beam_length");

				// ("in_aerial_beam_slope", aerial.f >= -aerial.b && aerial.f <= aerial.b, "Высота наклона луча не может быть больше длины луча.");
				// ("in_aerial_beam_slope", aerial.f >= -aerial.h, "Высота снижения луча не может быть больше высоты антенны");

			},
			'Т' : function () {
				this.h = this.lead_h;
				this.l = this.lead_h;
				this.nb = 2;
				this.b = this.beam_length;
				this.bf = 0;
				// this.beam_slope;

				this.check (this.lead_h > 0 && this.lead_h < this.lambda * KHMAX, "lead_h");
				this.check (this.beam_length > 0 && this.beam_length < this.lambda * KBMAX, "beam_length");

				// ("in_aerial_beam_slope", aerial.f >= -aerial.b && aerial.f <= aerial.b, "Высота наклона луча не может быть больше длины луча.");
				// ("in_aerial_beam_slope", aerial.f >= -aerial.h, "Высота снижения луча не может быть больше высоты антенны");
			},
			'U' : function () {
				this.h = this.lead_h;
				this.l = this.lead_h;
				this.nb = this.beam_quantity;
				this.b = this.beam_length;
				this.bf = this.beam_slope;

				// ("in_aerial_beam_length", aerial.b > 0, "Длина горизонтального луча должна быть больше 0.");
				// ("in_aerial_beam_slope", aerial.f >= -aerial.b && aerial.f <= aerial.b, "Высота наклона луча не может быть больше длины луча.");
				// ("in_aerial_beam_slope", aerial.f >= -aerial.h, "Высота снижения луча не может быть больше высоты антенны");
				// ("in_aerial_beam_quantity", aerial.nb > 0, "Количество горизонтальных лучей должно быть больше 0.");
			}
		};

		designes [this.design].call (this);

		// материал
		var material = Materials [this.wire_material];
		this.g = material.g;
		this.mu = material.mu;

        var groundE = Grounds [this.ground_type];           
        this.sigma = groundE.sigma;
        this.eps = groundE.eps;
               
        var ground;
        if (this.ground_system === '_') {
            ground = new IdealGround ();
        } else if (this.ground_system === '|') {
            this.check (this.ground_a >= 0.001, "ground_a");
            this.check (this.ground_l >= 0.05 && this.ground_l <= 3, "ground_l");

            ground = new ElectrodeGround (this.sigma, this.eps, this.ground_a, this.ground_l);
        } else {
            this.check (this.ground_s >= 0.05 && this.ground_s <= 3, "ground_s");
            this.check (this.ground_A >= 1.0, "ground_A");
            this.check (this.ground_rho >= 0.0001 && this.ground_rho <= this.ground_A / 10, "ground_rho1");
            this.check (this.ground_rho < this.ground_s, "ground_rho2");
            this.check (this.ground_n > 0, "ground_n");
       
            ground = new RadialGround (this.sigma, this.eps, this.ground_s, this.ground_A, this.ground_rho, this.ground_n);
        }        
        
		// антенна
		var antenna = new LongWire (this.h, this.l, this.b, this.nb, this.f, this.wire_De, this.g, this.mu, ground);
        this.antenna = antenna;
		
		var antennaAtLamda = this.antenna.fn (this.lambda);
        this.antennaAtLambda = antennaAtLamda;

        this.Sg = antennaAtLamda.Sg;
		this.W = antennaAtLamda.W;
		this.Wb = antennaAtLamda.Wb;
		this.R1 = antennaAtLamda.R1;
		this.Rl = antennaAtLamda.Rl;
		this.Rg = antennaAtLamda.Rgn;
        this.RS = antennaAtLamda.RSn;
		this.Ca = antennaAtLamda.C;
		this.La = antennaAtLamda.L;
		this.be = antennaAtLamda.be;
		this.hg = antennaAtLamda.lg;
		this.he = antennaAtLamda.le;
		this.Za = antennaAtLamda.Z;
		this.eta = antennaAtLamda.eta;
		this.D = antennaAtLamda.D ();
		this.G = Math.log10 (this.D * this.eta);
        this.psi = 2 * Math.PI * antennaAtLamda.be / this.lambda * 180 / Math.PI;
        this.phi = 2 * Math.PI * antennaAtLamda.le / this.lambda * 180 / Math.PI;

		this.f0 = antennaAtLamda.f0;
		this.lambda0 = antennaAtLamda.lambda0;

        this.check (this.be < this.lambda * KBMAX, "be");
        this.check (this.he < this.lambda * KHEMAX, "he");
        this.check (!isNaN (this.f0), "f0");

        this.fnZ = function (f) {
            return antenna.fn (Phys.C / f).Z;
        };
               
        // FIXME: Нам нужен только Z, а в цикле считается все данные антенны
        this.band = Plots.band (this.f, this.f0 / (1 - KHEMAX));        
        this.plot (Plots.impedanceResponseData (this.fnZ, this.band, 100), Plots.impedanceResponseAxes (this.band), 0);
	});
	
	var circuit = Calc.calc ({
		name : "circuit-1K",
		input : {
			// freq
			f : antenna.f,
			lambda : antenna.lambda,

			// power & load
			E : [1e-3],
			R : [1e3],
			kR : [2, 1, 1 / 2, 1 / 3, 1 / 4, 1 / 6, 1 / 8],

			// circuit
			design : ["L~", "CaL~", "Ca~L", "LC~", "CaLC~"],
			Cmin : [1e-12],
			Cmax : [1e-12],
			QC : [1e0],
			L : [1e-6],
			QL : [1e0],

			Cs : [1e-12],

			Lmin : [1e-6],
			Lmax : [1e-6],
			QLmin : [1e0],
			QLmax : [1e0]   
		},
		output : {
			X : [1e3, 2],
			Xmin : [1e3, 2],
			Xmax : [1e3, 2],
			Lx : [1e-6, 2],
			Cx : [1e-12, 2],
			fmin : [1e3, 2],
			fmax : [1e3, 2],

			Rn : [1e3, 2],
			Rk : [1e3, 2],

			KU : [1e-1, 2],
			Qn : [1e0, 2],
			B : [1e3, 2],
			delta : [1e0, 2],

			Zo : [1e3, 2, "complex"],
			Eo : [1e0, 2],

			za : [1e0, 2, "complex"],

			Ea : [1e-3, 2],
			Un : [1e-3, 2],
			Pn : [1e0, 2, "exp"]
		}
	}, function () {
		//--------------------------------------------------------------------------------------------------------------		
		this.check (this.R > 0, "R");
		this.Rk = this.R / (this.kR * this.kR);
		
		if (this.design === "L~" || this.design === "CaL~") {
			this.check (this.Lmin > 0, "Lmin");
			this.check (this.Lmax >= this.Lmin, "Lmax");
			this.check (this.QLmin > 0, "QLmin");
			this.check (this.QLmax > 0, "QLmax");
			this.check (this.design === "L~" || this.Cs > 0, "Cs");
					
			var Cs = this.design === "L~"
				? new Conductor (0)
				: new Capacitor (this.Cs, 5000);
				
			var omega = 2 * Math.PI * this.f;

			this.X = -antenna.Za.y;
			this.Xmin = Cs.fnZ (this.f).sum (Phys.fnInductor (this.f, this.Lmin, this.QLmin).Z).y;
			this.Xmax = Cs.fnZ (this.f).sum (Phys.fnInductor (this.f, this.Lmax, this.QLmax).Z).y;
			this.check (this.X >= this.Xmin && this.X <= this.Xmax, "X");

			this.Lx = Math.clamp (-antenna.Za.sum (Cs.fnZ (this.f)).y / omega, this.Lmin, this.Lmax);
			this.QLx = this.QLmin + (this.Lx - this.Lmin) / (this.Lmax - this.Lmin) * (this.QLmax - this.QLmin);

			var fnCircuit = function (f, aerial, L, QL, R, Cs) {
				var result = [];

				result.zA = aerial.Z;
				result.zR = new Complex (R, 0);
				result.zCs = Cs.fnZ (f);

				result.zL = Phys.fnInductor (f, L, QL).Z;
				result.zRL = result.zL.par (result.zR);
				result.z = result.zA.sum (result.zCs).sum (result.zRL);
				result.ZL = result.zA.sum (result.zCs).par (result.zL);
				result.Qn = result.zL.y / result.z.x; 

				result.fnU = function (E) {
					return new Complex (aerial.fnE (E), 0).div (result.z).mul (result.zRL);
				};

				return result;
			};

			this.fnCircuitF = function (f) {
				return fnCircuit (f, this.Lx, this.QLx, this.Rk, Cs);
			};

			this.fnCircuitFmin = function (f) {
				return fnCircuit (f, this.Lmax, this.QLmax, this.Rk, Cs);
			};

			this.fnCircuitFmax = function (f) {
				return fnCircuit (f, this.Lmin, this.QLmin, this.Rk, Cs);
			};
            
            this.fnCircuit = function (f) {
                var aerial = antenna.antenna.fn (Phys.C / f);
                return {
                    x : fnCircuit (f, aerial, this.Lx, this.QLx, this.Rk, Cs),
                    min : fnCircuit (f, aerial, this.Lmax, this.QLmax, this.Rk, Cs),
                    max : fnCircuit (f, aerial, this.Lmin, this.QLmin, this.Rk, Cs)
                };
            };            

			this.Eo = fnCircuit (this.f, antenna.antennaAtLambda, this.Lx, this.QLx, 1e12, Cs).fnU (this.E).mod ();
		} else if (this.design === "LC~" || this.design === "CaLC~") {
			this.check (this.Cmin > 0, "Cmin");
			this.check (this.Cmax >= this.Cmin, "Cmax");
			this.check (this.L > 0, "L");
			this.check (this.QL > 0, "QL");
			this.check (this.QC > 0, "QC");
			this.check (this.design === "LC~" || this.Cs > 0, "Cs");
					
			var Cs = this.design === "LC~"
				? new Conductor (0)
				: new Capacitor (this.Cs, 5000);
							
			var omega = 2 * Math.PI * this.f;

			var ZC = antenna.Za.sum (Cs.fnZ (this.f)).par (Phys.fnInductor (this.f, this.L, this.QL).Z);
			this.Xmin = Phys.fnCapacitor (this.f, this.Cmin, this.QC).Z.y;
			this.Xmax = Phys.fnCapacitor (this.f, this.Cmax, this.QC).Z.y;
			this.X = -ZC.y;

			this.check (this.X >= this.Xmin && this.X <= this.Xmax, "X");

			this.Cx = Math.clamp (1 / (-this.X * omega), this.Cmin, this.Cmax);

			fnCircuit = function (f, aerial, L, QL, C, QC, R, Cs) {
				var result = [];
                
				result.zA = aerial.Z;
				result.zR = new Complex (R, 0);
				result.zCs = Cs.fnZ (f);

				result.zL = Phys.fnInductor (f, L, QL).Z;
				result.zC = Phys.fnCapacitor (f, C, QC).Z;
				result.zRLC = result.zL.par (result.zR).par (result.zC);
				result.z = result.zA.sum (result.zCs).sum (result.zRLC);

				result.ZL = result.zA.sum (result.zCs).par (result.zL).par (result.zC);
				result.Qn = result.zRLC.par (result.zA.sum (result.zCs)).x / result.zL.y;

				result.fnU = function (E) {
					return new Complex (aerial.fnE (E), 0).div (result.z).mul (result.zRLC);
				};

				return result;
			};

            this.fnCircuit = function (f) {
                var aerial = antenna.antenna.fn (Phys.C / f);
                return {
                    x : fnCircuit (f, aerial, this.L, this.QL, this.Cx, this.QC, this.Rk, Cs),
                    min : fnCircuit (f, aerial, this.L, this.QL, this.Cmax, this.QC, this.Rk, Cs),
                    max : fnCircuit (f, aerial, this.L, this.QL, this.Cmin, this.QC, this.Rk, Cs)
                };
            };            
            
			this.Eo = fnCircuit (this.f, antenna.antennaAtLambda, this.L, this.QL, this.Cx, this.QC, 1e12, Cs).fnU (this.E).mod ();
		} else {
			this.check (this.Cmin > 0, "Cmin");
			this.check (this.Cmax >= this.Cmin, "Cmax");
			this.check (this.QC > 0, "QC");
			this.check (this.L > 0, "L");
			this.check (this.QL > 0, "QL");

			var omega = 2 * Math.PI * this.f;

			this.X = -antenna.Za.sum (Phys.fnInductor (this.f, this.L, this.QL).Z).y;
			this.Xmin = Phys.fnCapacitor (this.f, this.Cmin, this.QC).Z.y;
			this.Xmax = Phys.fnCapacitor (this.f, this.Cmax, this.QC).Z.y;
			this.check (this.X >= this.Xmin && this.X <= this.Xmax, "X");

			this.Cx = Math.clamp (1 / (-this.X * omega), this.Cmin, this.Cmax);

			var fnCircuit = function (f, aerial, L, QL, C, QC, R) {
				var result = [];

				result.zA = aerial.Z;
				result.zR = new Complex (R, 0);
				result.zC = Phys.fnCapacitor (f, C, QC).Z;
				result.zL = Phys.fnInductor (f, L, QL).Z;
				
				result.zRL = result.zL.par (result.zR);
				result.z = result.zA.sum (result.zC).sum (result.zRL);
				result.ZL = result.zA.sum (result.zC).par (result.zL);
				result.Qn = result.zL.y / result.z.x;

				result.fnU = function (E) {
					return new Complex (aerial.fnE (E), 0).div (result.z).mul (result.zRL);
				};

				return result;
			};

            this.fnCircuit = function (f) {
                var aerial = antenna.antenna.fn (Phys.C / f);
                return {
                    x : fnCircuit (f, aerial, this.L, this.QL, this.Cx, this.QC, this.Rk),
                    min : fnCircuit (f, aerial, this.L, this.QL, this.Cmax, this.QC, this.Rk),
                    max : fnCircuit (f, aerial, this.L, this.QL, this.Cmin, this.QC, this.Rk)
                };
            };
            
			this.Eo = fnCircuit (this.f, antenna.antennaAtLambda, this.L, this.QL, this.Cx, this.QC, 1e12).fnU (this.E).mod ();
		}

		this.check (this.E <= 10 && this.E > 0, "E");
		// э.д.с. эквивалентного генератора
		// вектор E считаем перпендикулярным земной поверхности
		// FIXME: обоснование 4
		// this.Ea = this.E * this.lambda * Math.sqrt (this.D * this.eta * this.Z.x / (4 * Phys.Z0 * Math.PI));
		// this.P = Math.pow (this.Ea, 2) / (4 * this.Z.x);
		this.Pa = Math.pow (this.E * this.lambda / (2.0 * Math.PI), 2) * (antenna.D * antenna.eta) / (4 * Phys.Z0 / Math.PI);
		this.Ea = Math.sqrt (4 * this.Pa * antenna.Za.x);

		var circuitAtF = this.fnCircuit (this.f).x;

		this.za = circuitAtF.z;
		this.Zo = circuitAtF.ZL;
		this.Rn = this.Zo.mod ();
		this.Un = circuitAtF.fnU (this.E).mod () * this.kR;
		this.Pn = this.Un * this.Un / this.R;

		var p0 = Math.pow (this.lambda * this.E / (2 * Math.PI), 2) / (4 * Phys.Z0 / Math.PI);
		// var k = 2 * Math.PI / this.lambda;
		// this.delta = 2 * Math.PI * circuit.z.x / (circuit.zL.y + antennaAtLamda.W * k * this.he / (Math.pow (Math.sh (k * this.he), 2)));
		// this.Qn = Math.PI / this.delta;
		
		this.Qn = circuitAtF.Qn;
		this.KU = Math.log10 (this.Pn / p0);
		this.B = this.f / this.Qn;

		//---------------------------------------------------------------------------------------------------
        var fmin = antenna.band [0];
        var fmax = antenna.band [1];
        
		var Ux, Umin, Umax;
		Ux = [];
		Umin = [];
		Umax = [];

		if (fmax > fmin) {
            var freq;
			for (freq = fmin; freq <= fmax; freq += (fmax - fmin) / 200) {
                var circuit = this.fnCircuit (freq);
                
				var px   = Math.pow (circuit.x.fnU (this.E).mod () * this.kR, 2) / this.R;
				var pmin = Math.pow (circuit.min.fnU (this.E).mod () * this.kR, 2) / this.R;
				var pmax = Math.pow (circuit.max.fnU (this.E).mod () * this.kR, 2) / this.R;

                var p0 = Math.pow (Phys.C / freq * this.E / (2 * Math.PI), 2) / (4 * Phys.Z0 / Math.PI);
                
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
				label : "При минимальной частоте настройки",
				shadowSize : 0
			}, {
				data : Umax,
				color : "#00F",
				label : "При максимальной частоте настройки",
				shadowSize : 0
			}], options1, 0);
		}
	});
}


$ (document).ready (function () {"use strict";
	Calc.init (crystal);
});
