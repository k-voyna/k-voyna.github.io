/*jslint plusplus: true */
/*global Complex: true, Phys: true */
Antenna = {
	fnMaxFunctionValue : function (fn, argMin, argMax) {"use strict";
		var arg, step, max;

		max = -Infinity;
		step = (argMax - argMin) / 1000;

		for ( arg = argMin; arg < argMax; arg += step) {
			if (fn (arg) > max) {
				max = fn (arg);
			}
		}

		return max;
	},

	fnSearch : function (fnX, bounds, value, min) {"use strict";
		var yleft, yright, xleft, xright;

		xleft = bounds [0];
		xright = bounds [0];
		yleft = fnX (xleft);
		yright = fnX (xright);

		for (; ; ) {
			if (yleft < value && yright < value) {
				yleft = yright;
				xleft = xright;
				xright = xright * 1.1;
				yright = fnX (xright);
			} else if (yleft < value && yright > value) {
				xright = xleft + (xright - xleft) / 2;
				yright = fnX (xright);
			} else {
				xleft = NaN;
				break;
			}

			if (Math.abs (yleft - value) < min) {
				break;
			}

			if (xleft > bounds [1] || isNaN (yleft) || isNaN (yright)) {
				xleft = NaN;
				break;
			}
		}

		return xleft;
	},

	fnResonance : function (fX, bounds, min) {"use strict";
		var Xleft, Xright, Fleft, Fright;

		Fleft = bounds [0];
		Fright = bounds [0];
		Xleft = fX (Fleft);
		Xright = fX (Fright);

		for (; ; ) {
           // console.log (Fleft + ' ' + Xleft);
        
            if ((Xleft < 0 && Xright < 0) || isNaN (Xleft)) {
				Xleft = Xright;
				Fleft = Fright;
				Fright = Fright * 1.01;
				Xright = fX (Fright);
			} else if (Xleft < 0 && Xright > 0) {
				Fright = Fleft + (Fright - Fleft) / 2;
				Xright = fX (Fright);
			} else {
                Fleft = NaN;
				break;
			} 

			if (Math.abs (Xleft) < min) {
				break;
			}            
            
			if (Fleft > bounds [1]) {
				Fleft = NaN;
				break;
			}
		}

		return Fleft;
	},

	fnWireWaveImpedance : function (l, d, lambda) {"use strict";
		return (Phys.Z0 / Math.PI) * (Math.log (l / (d / 2)) - 1) / 2;
	},

	fnWireWaveImpedanceV2 : function (l, d, lambda) {"use strict";
		return l <= lambda / 2
            ? (Phys.Z0 / Math.PI) * (Math.log (l / (d / 2)) - 1) / 2
            : (Phys.Z0 / Math.PI) * (Math.log (lambda / (d / 2)) - Math.GAMMA) / 2;
	},
    
	fnDipoleRadiationImpedance : function (lambda, l) {"use strict";
		var Ci2x, Ci4x, Si2x, Si4x, sin2x, cos2x, lnx, ln2x, W, RS0, XS0, x;

		x = 2 * Math.PI / lambda * l;

		// чтобы не зависнуть
		if (x > 1000) {
			return new Complex (NaN, NaN);
		}

		Ci2x = Math.Ci (2 * x);
		Ci4x = Math.Ci (4 * x);
		Si2x = Math.Si (2 * x);
		Si4x = Math.Si (4 * x);

		sin2x = Math.sin (2 * x);
		cos2x = Math.cos (2 * x);
		lnx = Math.log (x);
		ln2x = Math.log (2 * x);

		W = Phys.Z0 / (4 * Math.PI);

		// Гинкин Г.Г. Справочник по радиотехнике 1948, с. 606, форм. 90
		// Комплексное сопротивление излучения (в пучности тока)
		// Жук М.С., Молочков Ю.Б., Проектирование антенно-фидерных устройств Л.-1966, c. 110-111 (3-8, 3-9)
		RS0 = W * (2 * (Math.GAMMA + ln2x - Ci2x) + cos2x * (Math.GAMMA + lnx + Ci4x - 2 * Ci2x) + sin2x * (Si4x - 2 * Si2x));
		XS0 = W * (2 * Si2x + cos2x * (2 * Si2x - Si4x) + sin2x * (Math.GAMMA + lnx + Ci4x - 2 * Ci2x - 2));

		return new Complex (RS0, XS0);
	},
    
	fnLoadedMonopoleRadiationResistance : function (lambda, l, le, be) {"use strict";
		var Ci2x, Ci4x, Si2x, Si4x, sin2x, cos2x, lnx, ln2x;

        var k = 2 * Math.PI / lambda;
		var x = k * l;
        var xe = k * le;

		// чтобы не зависнуть
		if (x > 1000) {
			return new Complex (NaN, NaN);
		}

		Ci2x = Math.Ci (2 * x);
		Ci4x = Math.Ci (4 * x);
		Si2x = Math.Si (2 * x);
		Si4x = Math.Si (4 * x);

		sin2x = Math.sin (2 * x);
		cos2x = Math.cos (2 * x);
		lnx = Math.log (x);
		ln2x = Math.log (2 * x);

		var W = Phys.Z0 / (4 * Math.PI);

        // Надененко, с 281.
        var sinpsi = Math.sin (k * be);
        var sinxe = Math.sin (xe);
        var cos2xe = Math.cos (2 * xe);
        var sin2xe = Math.sin (2 * xe);
        var ln2 = Math.log (2);
        
        var A1 = cos2xe * (Math.GAMMA + lnx + Ci4x - 2 * Ci2x) / 2;
        var A2 = sin2xe * (Si4x - 2 * Si2x) / 2;
        var A3 = Math.GAMMA + ln2x - Ci2x + Math.pow (sinpsi, 2) * (sin2x / (2 * x) - 1);
        
		return W * (A1 + A2 + A3);
	},    

	fnWireLossResistance : function (lambda, d, g, mu) {"use strict";
		return 5.5 / (d / 2) * Math.sqrt (mu / (g * lambda));
	},

	fnPerfectLoadedTransmissionLineInputImpedance : function (kl, W, ZL) {"use strict";
		var Z0, coskl, sinkl, ZLcoskl, jZLsinkl, Z0coskl, jZ0sinkl, Z1, Z2;

		Z0 = new Complex (W, 0);
		coskl = new Complex (Math.cos (kl), 0);
		sinkl = new Complex (0, Math.sin (kl));

		ZLcoskl = ZL.mul (coskl);
		jZLsinkl = ZL.mul (sinkl);
		Z0coskl = Z0.mul (coskl);
		jZ0sinkl = Z0.mul (sinkl);

		Z1 = ZLcoskl.sum (jZ0sinkl);
		Z2 = Z0coskl.sum (jZLsinkl);

		return Z0.mul (Z1).div (Z2);
	},

	// эквивалентное волновое сопротивление
	fnLossyTransmissionLineWaveImpedance : function (W, beta, k) {
		return new Complex (W, 0).mul (beta.div (new Complex (k, 0)).mul (new Complex (0, -1)).sum (new Complex (1, 0)));
	},
    
	fnLossyOpenedTransmissionLineInputImedance : function (W, l, beta, k) {"use strict";
		return W.mul (beta.sum (new Complex (0, k)).mul (new Complex (l, 0)).cth ());
	},
    
	fnLossyClosedTransmissionLineInputImedance : function (W, l, beta, k) {"use strict";
		return W.mul (beta.sum (new Complex (0, k)).mul (new Complex (l, 0)).th ());
	}    
};

function MonopoleRadiator (h, D, d, N, g, mu, ground) {"use strict";
	// TODO: Проверки входных величин   
    function fnZGn (lambda) {
        return ground.fn (lambda, h, h, 0).Zn;
    }    
    
    function fnZ0 (lambda) {
        return new Complex (0, 0);
    }
    
	function fnR0 (lambda) {
		return 0;
	}    
      
	// сопротивление излучения
	function fnZSn (lambda) {
		return Antenna.fnDipoleRadiationImpedance (lambda, h).div (new Complex (2, 0));
	}

	// погонное сопротивление потерь
	function fnR1 (lambda) {
		return Antenna.fnWireLossResistance (lambda, d, g, mu) / N;
	}

	// параметры антенны
	function fnY (lambda, fnZSn, fnR1, fnZGn) {
        var result = [];
    
        // FIXME: расчет поправки
        result.k1 = 1.00;
		result.k = 2 * Math.PI / lambda;
        result.kk = result.k1 * result.k;
        result.W = Antenna.fnWireWaveImpedance (h, D, lambda);
                
        result.ZSn = fnZSn (lambda);
        result.Zgn = fnZGn (lambda);
        result.R1 = fnR1 (lambda); 
        
        var kkh2 = 2 * result.kk * h;        
        var m = (1 - Math.sin (kkh2) / (kkh2)) * h;
        
        result.Zn = result.ZSn.sum (result.Zgn).sum (new Complex (result.R1 / 2 * m, 0));
        result.Z1 = result.ZSn.sum (result.Zgn).div (new Complex (m, 0)).sum (new Complex (result.R1 / 2, 0));
        result.beta = result.Z1.div (new Complex (result.W, 0));
        result.W1 = Antenna.fnLossyTransmissionLineWaveImpedance (result.W, result.beta, result.k);
		result.Z = Antenna.fnLossyOpenedTransmissionLineInputImedance (result.W1, h, result.beta, result.kk);
        
        return result;
	}

	// резонансная частота и собственная длина волны
	var f0 = Antenna.fnResonance (function (f) {
		var lambda = Phys.C / f;
		return fnY (lambda, fnZSn, fnR1, fnZGn).Z.y;
	}, [1e3, 1000e6], 2);

	var lambda0 = Phys.C / f0;

	this.fn = function (lambda) {             
		var result = {};

		result.h = h;
		result.lambda0 = lambda0;
		result.f0 = f0;
        
        // FIXME: Упорядочить
        var gnd = ground.fn (lambda, h, h, 0);
        result.Sg = gnd.S;
        result.sg = gnd.sigma;

        // TODO: Учет влияния неидеальной земли 
        var ae = fnY (lambda, fnZSn, fnR1, fnZGn);
        result.Z = ae.Z;
		result.Z1 = ae.Z1;
		result.R1 = ae.R1;
		result.ZSn = ae.ZSn;
		result.W1 = ae.W1;                
		result.W = ae.W;
        result.C = 1 / (result.W * Phys.C / h);
        result.L = Math.pow (result.W, 2) * result.C;
        result.Zgn = ae.Zgn;
                
		// Rизл.
		result.RS = fnY (lambda, fnZSn, fnR0, fnZ0).Z.x;
        
		// Rзаземл.
		result.Rg = fnY (lambda, fnZ0, fnR0, fnZGn).Z.x;
        
		// КПД
		result.eta = ae.ZSn.x / ae.Zn.x;

		// F (Theta) диаграмма направленности в вертикальной плоскости
		result.fnF = function (Theta) {
			var k = 2 * Math.PI / lambda;
			return (Math.cos (k * h * Math.cos (Theta)) - Math.cos (k * h)) / Math.sin (Theta);
		};

		// D (Theta) КНД
		result.fnD = function (Theta) {
			return (Phys.Z0 / Math.PI) * Math.pow (result.fnF (Theta), 2) / ae.ZSn.x;
		};

        var k = 2 * Math.PI / lambda;
        var sinkl = Math.sin (k * h);
        result.Q = (ae.W * k * h / Math.pow (sinkl, 2)) / result.Z.x;        
               
		// КНД макс.
		// FIXME: упростить выражение
		result.D = function () {
            if (this._D === undefined)
                this._D = Phys.Z0 / Math.PI * Math.pow (Antenna.fnMaxFunctionValue (result.fnF, -Math.PI / 2, Math.PI / 2), 2) / ae.ZSn.x;
                
            return this._D;                
        };
        
		return result;
	};
}

function IdealMonopoleRadiator (h, d) {"use strict";
	return new MonopoleRadiator (h, d, Infinity, 1, 1, 0, new IdealGround ());
}

function IdealIsotropicRadiator () {"use strict";
	this.fn = function (lambda) {
		var result = {};

		// высота антенны
		result.h = 0;

		// сопротивление излучения
		result.RS = Phys.Z0 / Math.PI;

		// входное сопротивление антенны
		result.Z = new Complex (this.RS, 0);

		// диаграмма направленности в вертикальной плоскости
		result.fnF = function (Theta) {
			return 1;
		};

		// КНД
		result.fnD = function (Theta) {
			return 1;
		};

		result.D = function () { return 1; };
		result.eta = 1;

		return result;
	};
}

function MagneticLoop (D, w, h, d, N, g, mu) {"use strict";
    var S, W, l, p;

    if (D != 0) {
        p = Math.PI * D;
        S = Math.PI * D * D / 4;
        l = Math.PI * D * N;
        // http://www.technick.net/public/code/cp_dpage.php?aiocp_dp=util_inductance_circle
        W = (Phys.Z0 / Math.PI) * (Math.log (D / d) - 0.0794) * N;
    } else if (w === h) {       
        p = 4 * w;        
        S = w * w;
        l = p * N;
        
        // http://www.technick.net/public/code/cp_dpage.php?aiocp_dp=util_inductance_square
        W = (Phys.Z0 / Math.PI) * (Math.log (w / d) - 0.0809) * N;
    } else {
        p = 2 * (w + h);        
        S = w * h;
        l = p * N;

        var wh = Math.sqrt (h * h + w * w);        
        var Ww = w * (Math.log (4 * w / d) - Math.log ((w + wh) / h));
        var Wh = h * (Math.log (4 * h / d) - Math.log ((h + wh) / w));
        var Wwh = 2 * wh;
        var W1 = (Ww + Wh + Wwh) / (w + h);
        W = (Phys.Z0 / Math.PI) * (W1 - 2) * N;
    }

	// TODO: Проверки входных величин
	function fnZL (lambda, R1, RS) {
        var k = 2 * Math.PI / lambda;
        return Antenna.fnPerfectLoadedTransmissionLineInputImpedance (k * l / 2, W, new Complex (R1 * l + RS, 0));

        var beta = new Complex ((R1 + RS / l) / W, 0);
        var W1 = Antenna.fnLossyTransmissionLineWaveImpedance (W, beta, k);
		return Antenna.fnLossyClosedTransmissionLineInputImedance (W1, l / 2, beta, k);
	}

	this.fn = function (lambda) {
		var result;

		result = {};

        // действующая длина
        result.lg = 2 * Math.PI * N * S / lambda; 
                
        // погонное сопротивление потерь
		result.R1 = Antenna.fnWireLossResistance (lambda, d, g, mu);

		// Rизл.
		result.RS = 800 * Math.pow (result.lg / lambda, 2);
       
		// Rпот
		result.Rl = l * result.R1;
        
		// Zвх
		result.Z = fnZL (lambda, result.R1, result.RS);

        result.W = W;
        result.S = S;
        result.p = p;
        
        // Q    
        result.L = result.W * l / Phys.C;
        result.C = result.L / Math.pow (result.W, 2);
        
        // XXX: точный расчет по Надененко
        result.Q = Math.sqrt (result.L / result.C) / (result.RS + result.Rl);
        
		// КНД
		result.D = Phys.Z0 / (Math.PI * result.RS) * Math.pow (Math.PI * result.lg / lambda, 2);
       
		// КПД
		result.eta = result.RS / (result.RS + result.Rl);

		// Э.Д.С. эквивалентного генератора
		result.fnE = function (E) {
			return E * lambda * Math.sqrt (result.D * result.eta * result.Z.x / (4 * Phys.Z0 * Math.PI));
		};

		return result;
	};
}

 // MonopoleRadiator (h, D, d, N, g, mu, ground)
function OptimalMonopoleRadiator (k, lambda, g, sigma, eps) {"use strict";
    var ground = new RadialGround (sigma, eps, 3, lambda / 2, 1e-3, 120);
	return new MonopoleRadiator (k * lambda, 0.5, 0.5, 1, g, 1, ground);
}

// RadialGround (g, eps, s, A, rho, n)
function OptimalLoadedMonopoleRadiator (lambda, g, sigma, eps) {"use strict";
    var h = Math.min (lambda * 0.38, 250);
    var b = Math.min (Math.min (lambda * 0.4, 250), h / 2);
    var ground = new RadialGround (sigma, eps, 3, lambda / 2, 1e-3, 120);
	return new LongWire (h, h, b, 2, 0, 1, g, 1, ground);
}

function LongWire (h, l, b, nb, f, d, g, mu, ground) {"use strict";
	// TODO: Проверки входных величин
	// l/h <= 0,3
	// kr <= 0,01

    // коэффициент наклона
	var cosksi = h / l;

	// волновое сопротивление вертикальной части
	var W = Antenna.fnWireWaveImpedance (l, d); // XXX: а для h != l?

	// волновое сопротивление горизонтальной части
	var Wb = Antenna.fnWireWaveImpedance (b, d); // XXX: а для f != 0?

	function fnR0 () {
		return 0;
	}
        
	// погонное сопротивление потерь
	function fnR1 (lambda) {
		return Antenna.fnWireLossResistance (lambda, d, g, mu);
	}
    
    function fnRSn (lambda, l, le, be) {
        return Antenna.fnLoadedMonopoleRadiationResistance (lambda, l, le, be);
    }
    
    function fnY (lambda, fnRSn, fnR1, ground) {
        var result = [];        
                                                   
        // волновой коэффициент
        result.k = 2 * Math.PI / lambda;
        
		// эквивалентное удлинение
		// Кочержевский Г.Н. Антенно-фидерные устройства. 1989. с. 73
        // FIXME: Полная модель линии
        var Wbn = Wb / nb;
        result.Xb = Wbn / Math.tan (result.k * b);
        
        var kbe = (Math.atan (W / result.Xb) + Math.PI) % Math.PI;       
        result.be = kbe / result.k;
                         
        var hbe = (l - h) / 2;
        
        // эквивалентная длина
        result.le = l + result.be;
        result.he = h + result.be;
               
		// действующая длина
		// Кочержевский Г.Н. Антенно-фидерные устройства. 1989. с. 71. (3.37)
		// Белоцерковский Г.Б. Основы радиотехники и антенны. т.2. с.116
        result.lg = Math.abs ((Math.cos (result.k * result.be) - Math.cos (result.k * result.le)) / (Math.sin (result.k * result.le) * result.k)) * cosksi;

        // погонное сопротивление потерь
        result.R1 = fnR1 (lambda);
        
		// сопротивление излучения, отнесенное к току в пучности      
        result.RSn = fnRSn (lambda, l, l + result.be, result.be) * cosksi * cosksi; // FIXME: уточнить формулу 
        result.RSnD = fnRSn (lambda, h, h + result.be, result.be);
                
        // заземление
        var gnd = ground.fn (lambda, l, l + result.be, result.be); 
        gnd.Zn = gnd.Zn.mul (new Complex (cosksi * cosksi, 0));
        
        result.Zgn = gnd.Zn;
        result.Sg = gnd.S;  
        
        var kl2 = 2 * result.k * result.le;
        var sin2kl = Math.sin (kl2);
        var m = result.le * (1 - sin2kl / kl2);
        var R1 = result.R1 / 2 + (result.RSn + gnd.Zn.x) / m;
        
        result.Rn = result.RSn + gnd.Zn.x + (result.R1 / 2) * m;
        
        var beta = new Complex (R1, 0).div (new Complex (W, 0));
        var W1 = Antenna.fnLossyTransmissionLineWaveImpedance (W, beta, result.k);
        result.Z = Antenna.fnLossyOpenedTransmissionLineInputImedance (W1, result.le, beta, result.k);
               
        return result;
    }
    
    // резонансная частота и собственная длина волны
    var f0 = Antenna.fnResonance (function (f) {
        var lambda = Phys.C / f;
        return fnY (lambda, fnRSn, fnR1, ground).Z.y;
    }, [1e3, 100e6], 1);

    var lambda0 = Phys.C / f0;

	this.fn = function (lambda) {
        var ae = fnY (lambda, fnRSn, fnR1, ground);
        
		var result = {};
        result.h = h;
        result.Rgn = ae.Zgn.x;
        result.Sg = ae.Sg;
		result.W = W;
		result.Wb = Wb;
		result.R1 = ae.R1;
		result.le = ae.le;
		result.be = ae.be;
		result.lg = ae.lg;
		result.f0 = f0;
        result.RSn = ae.RSn;
		result.lambda0 = lambda0;
        result.C = 1 / (result.W * Phys.C / result.le);
        result.L = Math.pow (result.W, 2) * result.C;

		// F (Theta) диаграмма направленности в вертикальной плоскости
        // Надененко с.281
		result.fnF = function (Theta) {
            var cost = Math.cos (Theta);
            var khcost = ae.k * h * cost;
            var a1 = Math.cos (khcost) * Math.cos (ae.k * ae.be);
            var a2 = Math.sin (khcost) * Math.sin (ae.k * ae.be) * cost;
            var a3 = Math.cos (ae.k * ae.he);
            
			return (Math.abs (Theta) < 1e-12) ? 0 : (a1 - a2 - a3) / Math.sin (Theta);
		};

		// D (Theta) КНД
		result.fnD = function (Theta) {
			return (Phys.Z0 / Math.PI) * Math.pow (result.fnF (Theta), 2) / ae.RSnD;
		};

		// КНД макс.
		result.D = function () {
            if (this._D === undefined)
                this._D = Phys.Z0 / Math.PI * Math.pow (Antenna.fnMaxFunctionValue (result.fnF, -Math.PI / 2, Math.PI / 2), 2) / ae.RSnD;
                
            return this._D;
        }
     
        // входное сопротивление
		result.Z = ae.Z;        
          
        // сопротивление излучения
        result.RS = function () {
            return fnY (lambda, fnRSn, fnR0, new IdealGround ()).Z.x;
        }

        // сопротивление заземления
		result.Rg = function () {
            return fnY (lambda, fnR0, fnR0, ground).Z.x;
        }
        
		// КПД
		result.eta = ae.RSn / ae.Rn;
        
        // Q
        var k = 2 * Math.PI / lambda;
        var sinkle = Math.sin (k * ae.le);
        result.Q = (W * k * l / Math.pow (sinkle, 2) + Math.pow (W * Math.cos (2 * Math.PI * ae.be / lambda) / sinkle, 2) / Math.abs (ae.Xb)) / result.Z.x;

		// Э.Д.С. эквивалентного генератора
        // FIXME: Проверить
		result.fnE = function (E) {
			return E * lambda * Math.sqrt (result.D () * result.eta * result.Z.x / (4 * Phys.Z0 * Math.PI));
		};

		return result;
	};
}

/*
 // XXX Qa
 // XXX точный расчет для наклонных
 // XXX наклон луча для Г-образных и Т-образных
 // XXX учитывать емкость между проводом и землей для низких антенн
 // XXX собственная добротность от f неизвестна
 // XXX Влияние земли
 // действующая высота наклона луча
 //  aerial.fg = (aerial.b != 0) ? (1 - Math.cos (k * aerial.b)) / (Math.sin (k * aerial.b) * k) * (aerial.f / aerial.b) : 0;
 */
 
function IdealGround () {"use strict";
    this.fn = function (lambda, l, le, be) {
        var result = [];
        result.S = 0;
        result.Zn = new Complex (0, 0);
        result.sigma = new Complex (0, 0);
        return result;        
    };
}

function fnX (x, lambda, l, A, k, sinkbe, coskbe, coskleX2) {   
    var r2 = Math.sqrt (l * l + x * x);    
    var lr2 = l / r2;
    var kr2x = k * (r2 - x);
    var sinkbelr2 = sinkbe * lr2;
    
    return A        
         + Math.pow (sinkbelr2, 2) 
         - coskbe * coskleX2 * Math.cos (kr2x)
         + sinkbelr2 * coskleX2 * Math.sin (kr2x);
}
 
function ElectrodeGround (g, eps, a, s) {"use strict";
    this.fn = function (lambda, l, le, be) {           
        var omega = 2 * Math.PI * Phys.C / lambda;
        var sigma = new Complex (g, omega * Phys.EPS0 * eps);

        // TODO: Комплесная проводимость
        var S = 1 / Math.sqrt (Math.PI * Phys.MU0 * sigma.x * Phys.C / lambda);
        var z = Math.min (S, s);
        var k = 2 * Math.PI / lambda;
        var sinkbe = Math.sin (k * be);        
        var coskbe = Math.cos (k * be);
        var coskle = Math.cos (k * le);
        var coskleX2 = 2 * coskle;
        var A = Math.pow (coskbe, 2) + Math.pow (coskle, 2);
            
        function fi (x) {
            return fnX (x, lambda, l, A, k, sinkbe, coskbe, coskleX2) / x;
        }
            
        var Rg = 1 / (2 * Math.PI * z) * (Math.integrate (fi, a / 2, 1.0, 100)
                                       + Math.integrate (fi, 1.0, 10.0, 20)
                                       + Math.integrate (fi, 10.0, lambda / 2, 20));
        var result = [];
        result.sigma = sigma;
        result.S = S;
        result.Zn = new Complex (Rg / sigma.mod (), 0);
        
        return result;
    };
}
 
function RadialGround (g, eps, s, A, rho, n) {"use strict";
    this.fn = function (lambda, l, le, be) {    
        var omega = 2 * Math.PI * Phys.C / lambda;
        var sigma = new Complex (g, omega * Phys.EPS0 * eps);
        var k = 2 * Math.PI / lambda;
        var sinkbe = Math.sin (k * be);        
        var coskbe = Math.cos (k * be);
        var coskle = Math.cos (k * le);
        var coskleX2 = 2 * coskle;
        var B = Math.pow (coskbe, 2) + Math.pow (coskle, 2);
        
        function fi (x) {
            return fnX (x, lambda, l, B, k, sinkbe, coskbe, coskleX2) / x;
        }
       
        function FI (x) {
            var C = Math.PI * x / n;
            var y = 1e4 * Math.pow (12 * g * C * Math.log (C / (rho / 2) - 0.5) / lambda, 2);
            
            return y / (1 + y);
        }
        
        function fiFI (x) {
            return fi (x) * FI (x); 
        }
               
        var a = n * rho / (2 * Math.PI);
        var I1 = Math.integrate (fiFI, a, 1.0, 20);
        var I2 = Math.integrate (fiFI, Math.max (1.0, a), Math.min (A, lambda / 2), 20);
        var I3 = Math.integrate (fi, A, lambda / 2, 20);

        var S = 1 / Math.sqrt (Math.PI * Phys.MU0 * sigma.mod () * Phys.C / lambda);
        var Ig = 1 / (2 * Math.PI * Math.min (s, S)) * (I1 + I2) + 1 / (2 * Math.PI * Math.min (s, S)) * I3;       
        
        var result = [];
        result.S = S;
        result.sigma = sigma;
        result.Zn = new Complex (Ig / sigma.mod (), 0);
        
        return result;
    };
}

// XXX: Уточнить расчет добротности (гиперболический синус)