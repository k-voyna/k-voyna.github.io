Phys = {
    // скорость света [м/с]
    C : 299792458,
    // волновое сопротивление вакуума [Ом]
    Z0 : 119.9169832 * Math.PI,
    // опорное звуковое давление [Па]
    P0 : 20e-6,
    // постоянная Больцмана [м^2 * кг * с^-2 * K^-1]
    K : 1.3806503e-23,
    // заряд электрона [Кл]
    E0 : 1.60217646e-19,
    // радиус Земли
    Re : 6378e3,

    // модель катушки идуктивности
    fnInductor : function (f, L, Q) {
        var result = [];
        var XL = 2 * Math.PI * f * L;
        result.Z = new Complex (XL / Q, XL);
    
        return result;
    },

    // модель конденсатора
    fnCapacitor : function (f, C, Q) {
        var result = [];
        var XC = 1 / (2 * Math.PI * f * C);
        result.Z = new Complex (XC / Q, -XC);
    
        return result;
    }
};

// модель конденсатора
function Capacitor (C, Q) {"use strict";
	this.fnZ = function (f) {
		return Phys.fnCapacitor (f, C, Q).Z;
	};
};

// модель проводника
function Conductor (R) {"use strict";
	this.fnZ = function (f) {
		return new Complex (R, 0);
	};
};
