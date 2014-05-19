function sum (obj) {
    var a, b, c, d;
    
    a = this.x;
    b = this.y;
    c = obj.x;
    d = obj.y;

    return new Complex (a + c, b + d);
}

function sub (obj) {
    var a, b, c, d;
    
    a = this.x;
    b = this.y;
    c = obj.x;
    d = obj.y;
    
    return new Complex (a - c, b - d);
}

function mul (obj) {
    var a, b, c, d;
    
    a = this.x;
    b = this.y;
    c = obj.x;
    d = obj.y;
    
    return new Complex (a * c - b * d, b * c + a * d);
}

function div (obj) {
    var a, b, c, d;
    
    a = this.x;
    b = this.y;
    c = obj.x;
    d = obj.y;
    
    return new Complex ((a * c + b * d) / (c * c + d * d), (b * c - a * d) / (c * c + d * d));
}

function pow (n) {
    var r = this.mod (), p = this.arg ();
    var u = Math.pow (r, n) * Math.cos (n * p);
    var v = Math.pow (r, n) * Math.sin (n * p);
    return new Complex (u, v);
}

function p () {
    if (Math.abs (this.x) < 1.E-7)
        this.x = 0;
    if (Math.abs (this.y) < 1.E-7)
        this.y = 0;
    if (this.y >= 0) {
        var s = this.x + '+' + this.y + 'i';
        return s;
    } else {
        var s = this.x + ' ' + this.y + 'i';
        return s;
    }
}

function exp () {
    with (Math) {
        var u = exp (this.x) * cos (this.y);
        var v = exp (this.x) * sin (this.y);
        return new Complex (u, v);
    }
}

function log () {
    with (Math) {
        var u = log (this.mod ());
        var v = this.arg ();
        return new Complex (u, v);
    }
}

function sm () {
    return new Complex (this.x, -this.y);
}

function sin () {
    var i = new Complex (0, 1);
    var t = new Complex (2, 0);
    var tm1 = i.mul (this).exp ();
    var tm2 = i.sm ().mul (this).exp ();
    var tm3 = i.mul (t);
    return tm1.sub (tm2).div (tm3);
}

function cos () {
    var i = new Complex (0, 1);
    var t = new Complex (2, 0);
    var tm1 = i.mul (this).exp ();
    var tm2 = i.sm ().mul (this).exp ();
    return tm1.sum (tm2).div (t);
}

function stp (obj) {
    return obj.mul (this.log ()).exp ();
}

function asin () {
    var i = new Complex (0, 1);
    var t = new Complex (1, 0);
    var tm1 = t.sub (this.pow (2)).pow (.5);
    var tm2 = i.mul (this).sum (tm1);
    return tm2.log ().div (i);
}

function acos () {
    var i = new Complex (0, 1);
    var t = new Complex (1, 0);
    var tm1 = this.pow (2).sub (t).pow (.5);
    var tm2 = this.sum (tm1);
    return tm2.log ().div (i);
}

function atg () {
    var i = new Complex (0, 1);
    var t = new Complex (1, 0);
    var tm1 = t.sum (i.mul (this));
    var tm2 = t.sub (i.mul (this));
    return tm1.div (tm2).log ().div (i.sum (i));
}

function s2p () {
    var Rs = this.x;
    var Xs = this.y;

    var Rp = Rs * (1 + Math.pow (Xs, 2) / Math.pow (Rs, 2));
    var Xp = Xs * (1 + Math.pow (Rs, 2) / Math.pow (Xs, 2));

    return new Complex (Rp, Xp);
}

function p2s () {
    var Rp = this.x;
    var Xp = this.y;

    var Rs = Rp / (1 + Math.pow (Rp, 2) / Math.pow (Xp, 2));
    var Xs = Xp / (1 + Math.pow (Xp, 2) / Math.pow (Rp, 2));

    return new Complex (Rs, Xs);
}

function par (obj) {
    return this.mul (obj).div (this.sum (obj));
}

function Complex (x, y) {"use strict";
    this.x = x;
    this.y = y;

    // вещественная и мнимая части
    this.re = function () {
        return this.x;
    };

    this.im = function () {
        return this.y;
    };

    // модуль и аргумент
    this.mod = function () {
        return Math.sqrt (this.x * this.x + this.y * this.y);
    };
    
    this.arg = function () {
        return Math.atan (this.y / this.x);
    };
    
    this.sm = sm;
    this.sum = sum;
    this.sub = sub;
    this.mul = mul;
    this.div = div;
    this.pow = pow;
    this.p = p;
    this.exp = exp;
    this.log = log;
    
    // тригонометрические функции
    this.sin = sin;
    this.cos = cos;
    
    this.tg = function tg () {
        return this.sin ().div (this.cos ());
    };
    
    this.ctg = function ctg () {
        return this.cos ().div (this.sin ());
    };
    
    this.stp = stp;
    this.asin = asin;
    this.acos = acos;
    this.atg = atg;
    this.s2p = s2p;
    this.p2s = p2s;
    this.par = par;
    
    // гиперболические функции
    this.cth = function () {
        var A, B;
        
        A = new Complex (Math.sh (2 * this.x), -Math.sin (2 * this.y));
        B = new Complex (Math.ch (2 * this.x) -Math.cos (2 * this.y), 0);
        
        return A.div (B); 
    };
    
    // гиперболические функции
    this.th = function () {
        var A, B;
        
        A = new Complex (Math.sh (2 * this.x), -Math.sin (2 * this.y));
        B = new Complex (Math.ch (2 * this.x) -Math.cos (2 * this.y), 0);
        
        return B.div (A); 
    };    
}
