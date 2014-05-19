/*jslint plusplus: true */
/*global Phys: true, Calc: true, Complex: true */
/*global LongWire: true */
/*global Materials: true, Grounds: true, Plots: true, Diodes: true */
/*global Conductor: true, Capacitor: true */

function crystal () {"use strict";
    var diode = Calc.calc ({
        name : "diode",
        input : {
            type : [],
            t : [1e0]
        },
        output : {
            T : [1e0, 3],
            IS : [1e0, 2, "exp"], 
            IS0 : [1e0, 2, "exp"],
            RS : [1e0, 2],
            N : [1e0, 3],
            Vj : [1e0, 2],
            Vt : [1e-3, 2],
            EG : [1e0, 2],
            BV : [1e0, 2],
            GMIN : [1e0, 2, "exp"],
            XTI : [1e0, 2],
            IBV : [1e0, 2, "exp"],
            kind : []
        }
    }, function () {
        this.check (this.t >= -70 && this.t <= 70, "t");
        
        var model, Vd, Vf, id;

        // SPICE-модель диода
        model = Diodes [this.type];

        this.T = this.t + 273;
        this.IS0 = model.IS;
        this.RS = model.RS;
        this.N = model.N;
        this.M = model.M;
        this.EG = model.EG;
        this.GMIN = model.GMIN;
        this.kind = model.TYPE;
        this.Vj = model.VJ;
        this.BV = model.BV;
        this.IBV = model.IBV;
        this.XTI = model.XTI;

        // тепловой потенциал
        this.Vt = Phys.K * this.T / Phys.E0;
        
        // тепловой ток
        this.IS = this.IS0 * Math.pow (this.T / 300, this.XTI / this.N) * Math.exp (Phys.E0 * this.EG / (this.N * Phys.K) * (1 / 300 - 1 / this.T));

        var NVt = this.N * this.Vt;
                    
        // зависимость тока через диод от напряжения на переходе
        this.fnI = function (Vd) {
            var Id;
              
            // TODO: Учесть GMIN от T
            // модель без учета пробоя обратным напряжением
            if (this.type === "ideal") {
                if (Vd >= 0) {
                    Id = 10;
                } else {
                    Id = 0;
                }            
            } else {
                if (Vd >= -5 * NVt) {
                    Id = this.IS * (Math.exp (Vd / NVt) - 1) + this.GMIN * Vd;
                } else {
                    Id = -this.IS + this.GMIN * Vd;
                }            
            }
                        
            return Id;
        };

        // ВАХ в области малых напряжений
        Vf = [];
        for (Vd = -0.35; Vd <= 0.35; Vd += 0.0001) {
            id = this.fnI (Vd);

            Vf.push ([this.RS * id + Vd, id]);
        }

        // график ВАХ
        this.plot (
            [{
                data : Vf,
                color : "#00F",
                shadowSize: 0
            }], {
            xaxis: {
                color : "#211",
                axisLabel : "Напряжение на диоде, В",
                tickDecimals: 2,
                min : -0.25001,
                max : 0.25001
            },
            
            yaxis: {
                color : "#211",
                axisLabel : "Ток через диод, мкА",
                max : 10e-6,
                tickFormatter : function formatter (val, axis) {
                    return Math.round (val * 1e6);
                }
            },
            
            grid: {
                markings: [{ 
                    xaxis: { 
                        from: 0, 
                        to: 0
                    },
                        
                    color: "#000" 
                },{ 
                    yaxis: { 
                        from: 0, 
                        to: 0
                    },
                        
                    color: "#000" 
                }],
                
                markingsLineWidth: 1,
            }            
        });
    });    
    
    var headphonesHZ = Calc.calc ({
        name : "headphonesHZ",
        input : {
            f : [1e0],
            type : [],
            N : [1, 2]
        },
        output : {
            P1 : [1e0, 2],
            M1 : [1e0, 2],
            r1 : [1e3, 2],
            R1 : [1e3, 2],
            L1 : [1e0, 2],
            C1 : [1e-12, 2],
            Z : [1e3, 2, "complex"],
            Zm : [1e3, 2],
            phi : [1e0, 2],
            M : [1e0, 2],
            SPL : [1e-1, 3],
            eta : [1e-2, 2]
        }
    }, function () {
        var phone;
       
        this.check (this.f >= 20 && this.f <= 20000, "f");
        
        // выбираем модель
        phone = Transducers [this.type];
        
        this.P1 = phone.P;
        this.r1 = phone.r;
        this.L1 = phone.L;
        this.C1 = phone.C;
        this.R1 = phone.R;
                
        // импеданс
        this.fnZ = function (f) {           
            var omega = 2 * Math.PI * f + 1e-30;
            var Z = new Complex (0, 0);
            
            for (var n = 0; n < this.N; ++n) {
                var z1 = new Complex (this.r1, omega * this.L1);
                var z2 = new Complex (0, -1 / (omega * this.C1));
                var z3 = new Complex (this.R1, 0);
                
                Z = Z.sum (z1.par (z2.par (z3)));
            }
            
            return Z;
        };

        this.C = this.C1 / this.N;
        this.Z = this.fnZ (this.f);        

        // модуль и аргумент импенданса
        this.Zm = this.Z.mod ();
        this.phi = this.Z.arg () * 180 / Math.PI;
              
        // чувствительность
        this.M1 = this.P1 * Math.sqrt (1e3 / (this.Zm / this.N));

        // относительный уровень звукового давления на 1 мВт 
        this.SPL = 2 * Math.log (this.P1 / Phys.P0) / Math.LN10;

        // КПД наушников
        // FIXME: источник
        this.eta = Math.pow (10, this.SPL - 13.2);
        
        var f, options1, data, v, z, phi, Z, PHI;
        
        Z = [];
        PHI = [];
        for (f = 100; f < 11000; f *= 1.1) {
           v = this.fnZ (f);
           z = v.mod ();
           phi = v.arg () / Math.PI * 180;
           
           Z.push ([f, z]);
           PHI.push ([f, phi]);
        }
    
        options1 = {
            series: {
                lines: { 
                    show: true,
                    lineWidth: 2,
                    zero: false 
                }
            },
            
            xaxis: { 
                ticks: [[100, "100"], [200, "200"], [300, ""], [400, ""], [500, "500"], [600, ""], [700, ""], [800, ""], [900, ""], 
                        [1000, "1к"], [2000, "2к"], [3000, ""], [4000, ""], [5000, "5к"], [6000, ""], [7000, ""], [8000, ""], [9000, ""],
                        [10000, "10к"]],
                        
                axisLabel: "Частота, Гц",                        
                        
                transform: function (x) {
                    return Math.log (x + 0.0001); /*move away from zero*/
                }, 
                
                color : "#000000",
                
                tickDecimals: 0 
            },
            
            yaxes: [{
                ticks: [[100, "100"], [200, "200"], [300, ""], [400, ""], [500, "500"], [600, ""], [700, ""], [800, ""], [900, ""],
                        [1000, "1к"], [2000, "2к"], [3000, ""], [4000, ""], [5000, "5к"], [6000, ""], [7000, ""], [8000, ""], [9000, ""],    
                        [10000, "10к"], [20000, "20к"], [30000, ""], [40000, ""], [50000, "50к"], [60000, ""], [70000, ""], [80000, ""], [90000, ""],
                        [100000, "100к"]],
                
                position : "left",               
                
                transform:  function (y) {
                    return Math.log (y + 0.0001); /*move away from zero*/
                }, 
                
                axisLabel: "Магнитуда, Ом",
                
                color : "#000000",
                
                tickDecimals: 0,
                min : 100,
                max : 100000 
            }, {
                ticks : [-90, -45, 0, 45, 90],                        
                axisLabel: "Фаза, °",
                position : "right",
                tickDecimals: 0,
                color : "#000000",
                min : -90,
                max : 90
            }],
            
            grid: { color: "#000" },
            
            legend: {
                show: true,
                noColumns : 2,
                position: "sw"
            }
        };    
    
        data = [{
             label: "Магнитуда",
             data : Z,
             color : "#000",
             yaxis: 1,
             shadowSize : 2
        }, {
             label: "Фаза",
             data : PHI,
             color : "#0000ff",
             yaxis: 2,
             shadowSize : 2
        }];
    
        this.plot (data, options1);
    });
    
    var headphonesLZ = Calc.calc ({
        name : "headphonesLZ",
        input : {
            f : [1e0],
            SPL : [1e-1],
            R : [1e0],
            T : [220/12, 220/9, 220/6, 220/4.5, 220/3],
            etaT : [1e-2]
        },
        output : {
            P : [1e0, 2],
            S : [1e0, 2],           
            f : [1e0, 2],
            K : [1e0, 2],
            Ze : [1e3, 2],
            etaH : [1e-2, 2],
            eta : [1e-2, 2],
            SPLV : [1e-1, 3]
        }
    }, function () {       
        // FIXME: check R, SPL, etaT
        
        this.K = this.T;
        this.Ze = this.R * Math.pow (this.K, 2);
        
        // КПД наушников
        // FIXME: источник        
        this.etaH = Math.pow (10, this.SPL - 13.2);
        
        // Отдача
        this.P = Math.pow (10, this.SPL / 2) * Phys.P0;
        
        this.S = this.P / Math.sqrt (1e-3 * this.R); 
 
        this.SPLV = 2 * Math.log (this.S / Phys.P0) / Math.LN10;
        
        // Сквозной КПД
        this.eta = this.etaH * this.etaT;
    });
    
    var headphones = headphonesHZ;    
    
    var detector = Calc.calc ({
        name : "detector",
        input : {
            E : [1e-3],
            r : [1e3],
            fo : [1e3],
            fOmin : [1e0],
            fOmax : [1e0],
            Pi : [4, 10, 1],
            m : [1e0],
            Cx : [1e-12],
        //    k : [8, 6, 4, 3, 2, 1, 1 / 2, 1 / 3, 1 / 4, 1 / 6, 1 / 8],
            k : 1,
            M : headphones.M1,
        },
        output : {
            Rn : [1e3, 2],
            Cn : [1e-9, 2],
        
            Ek : [1e0, 2],
            rk : [1e3, 2],
            Ui : [1e-3, 2],
            Uo : [1e-3, 2],
            Uw : [1e-3, 2],
            Kd : [1e0, 2, "exp"],
            Kf : [1e0, 2, "exp"],
            
            PiO : [1e0, 1],
            Ri : [1e3, 2],
            Rw : [1e3, 2],
            Rd : [1e3, 2],
            Po : [1e0, 2, "exp"],
            Pw : [1e0, 2, "exp"],
            Pomega : [1e0, 2, "exp"],
            PomegaA : [1e0, 2, "exp"],
            Id_avg : [1e-6, 2],
            Id_w : [1e-6, 2],
            Id_eff : [1e-6, 2],
            KdP : [1e0, 2],
            Romega : [1e3, 2],
            Rid : [1e3, 2],
            Uomega : [1e-3, 2],
            UomegaA : [1e0, 2, "exp"],
            Kdomega : [1e0, 2, "exp"],
            momega : [1e0, 2],
            SPL : [1e-1, 2]
        }
    }, function () {
        this.check (this.fo >= 100e3 && this.fo < 3e6, "fo");
        this.check (this.E > 0 && this.E < 10, "E");
        this.check (this.r > 10, "r");
        this.check (this.fOmax <= 10000 && this.fOmax >= 1000, "fOmax");
        this.check (this.m > 0 && this.m < 1, "m");
        this.check (this.Cx >= 0, "Cx");
        
        this.omega = 2 * Math.PI * this.fo;
        this.Rn = headphones.fnZ (0).x;
        this.Cn = headphones.C + this.Cx + 3e-12;

        this.PiO = this.Pi;
        this.Ek = this.E * this.k;
        this.rk = this.r * this.k * this.k;
        this.Rd = this.Rn;
        
        // ВАХ в области малых напряжений
        var f = [];
        var ie0 = [];
        var Umin = Math.min (-0.26, -this.Ek * 3);
        var Umax = 1.0;
                
        for (var U = Umin; U <= Umax; U += (Umax - Umin) / 1000) {
            var I = diode.fnI (U);
            var E = U + I * (diode.RS + this.Rd);
            
            f.push ([E, I * this.Rd]);
            ie0.push ([U + I * (this.rk + diode.RS), I]);
        }
        
        var fnDetector = function (E, f, Cn, Rn, N, eps) {
            // Rn, Cn
            var w = 2 * Math.PI * f;
            var t = 0;
            var dt = 1 / (N * f);
            var Xc = 1 / (w * Cn);
            
            var UC = 0;
            var UCS = 0;
            var UCw = 0;
            var n = 0;          
            
            for (t = 0; ; t += dt, ++n) {
                var Et = E * Math.sin (w * t);
                
                var I = Math.interpolate (ie0, Et - UC);
                UC = UC + (1 / Cn * (I - UC / Rn) * dt);

                UCw += UC * Math.sin (w * t);                
                UCS += UC;
                
                // XXX: проверить по DT: dUC < eps * dUC
                if (n > N * 500) {
                    break;
                }
            }
           
            var Uavg = UCS / n;
            var Uw = UCw / n;
            var IW = 0;
            var IE = 0;
            var IS = 0;
            
            for (var phi = 0; phi < 2 * Math.PI; phi += 2 * Math.PI / N) {
                var Et = E * Math.sin (phi);
                var I = Math.interpolate (ie0, Et - Uavg);
                
                IS += I;
                IE += I * I;
                IW += I * Math.sin (phi);
            }
                       
            var result = [];
            
            result.Uw = Uw;
            result.Uavg = Uavg;
            result.Iavg = IS / N;
            result.Ieff = Math.sqrt (IE / N);
            result.Iw = IW / N;
           
            return result;
        };
        
        this.fnDetector = function (E) {
            return fnDetector (E, this.fo, this.Cn, this.Rd, 20, 1e-6);
        };
                       
        var s = [];
        var Emax = this.Ek * 2;
        for (var E = 0; E <= Emax * 1.01; E += Emax / 100) {           
            s.push ([E, this.fnDetector (E).Uavg]);
        }               

        var y = this.fnDetector (this.Ek);
        
        this.Id_avg = y.Iavg;
        this.Uo = y.Uavg;
        this.Uw = y.Uw;
        this.Id_eff = y.Ieff;
        this.Id_w = y.Iw;
                    
        this.Rw = this.Ek / this.Id_w - this.rk;
        this.Ri = (this.Ek / Math.sqrt (2)) / this.Id_eff - this.rk;
        this.Ui = this.Id_eff * this.Ri;
        this.Kd = this.Uo / (this.Ui * Math.sqrt (2));
        this.Kf = this.Uw / (this.Ui * Math.sqrt (2));
        this.Rid = this.Ri - this.Rd;
       
        this.fnOmega = function (fOmega, E, m) {
            var result = [];
            var Imin = Math.interpolate (s, E * (1 - m)) / this.Rd;
            var Imax = Math.interpolate (s, E * (1 + m)) / this.Rd;
            var Iomega = (Imax - Imin) / 2;

            result.R = headphones.fnZ (fOmega).par (new Complex (this.Rid, 0)).par (new Complex (0, -1/ (2 * Math.PI * fOmega * this.Cn))).mod ();
            result.U = Iomega * result.R;
            result.K = result.U / (E * m);
        
            return result;
        };
        
        var Om = this.fnOmega (1000, this.Ek, this.m);
        
        this.Romega = Om.R;
        this.Uomega = Om.U;
        this.Kdomega = Om.K;
        this.momega = this.Kdomega / this.Kd;
       
        var Zn = headphones.fnZ (1000).mod ();
        
        this.Iomega = (this.Uomega / this.Romega) - (this.Uomega / this.Rid);
        this.Pomega = this.Iomega * this.Iomega * Zn;
        this.PomegaA = this.Pomega / Math.pow (this.Pi, 2);
        this.UomegaA = this.Uomega / this.Pi;
        this.SPL = 2 * Math.log10 (this.UomegaA / Math.sqrt (headphones.N) * this.M / Phys.P0);
        this.SPL = this.SPL > 0 ? this.SPL : 0;

        var OmegaMax = 2 * Math.PI * this.fOmax;
        this.suggest (this.Rd > 3 / (this.omega * this.Cn), "CxQ");
        this.suggest (this.Rd * this.Cn * OmegaMax <= (1 - this.m * this.m) / this.m, "fOmax1");
        this.suggest (Zn * 3 < 1 / (OmegaMax * this.Cn), "fOmax2");
        this.suggest (this.SPL >= 2, "SPL");
               
        // XXX: Проверить LC

        // TODO: Согласование по нагрузке ПТ
        // TODO: Согласование по мощности ЗЧ
        // TODO: momega=f(Omega)
        // TODO: Rвх=f(Um)
        // TODO: КНИ: gamma = sqrt (Sum (Jm2Omage^2 + ...) / JmOmega^2)
        // TODO: Спектральная характеристика сигнала, более точный расчет средней мощности
        // TODO: Учет емкости проводов наушников
        
        this.plot ([{
                data : f,
                color : "#11F",
                shadowSize: 0
            }], {
            xaxis: {
                color : "#111",
                axisLabel : "Напряжение на входе U<sub>вх</sub>, мВ",
                min : -0.2501,
                max : 0.2501,
                
                tickFormatter : function formatter (val, axis) {
                    var digits = axis.tickDecimals - 3 >= 0 ? axis.tickDecimals - 3 : 0;
                    return (val * 1e3).toFixed (digits);
                }                
            },
            yaxis: {
                color : "#111",
                axisLabel : "Напряжение на выходе U<sub>вых</sub>, мВ",
                min : -0.0201,
                max : 0.10,
               
                tickFormatter : function formatter (val, axis) {
                    var digits = axis.tickDecimals - 3 >= 0 ? axis.tickDecimals - 3 : 0;
                    return (val * 1e3).toFixed (digits);
                }
            },
            grid: {
                markings: [{ 
                    xaxis: { 
                        from: 0, 
                        to: 0
                    },
                        
                    color: "#222" 
                },{ 
                    yaxis: { 
                        from: 0, 
                        to: 0
                    },
                        
                    color: "#222" 
                }],
                
                markingsLineWidth: 1,
            }            
        }, 0);
        
        this.plot (
            [{
                data : s,
                color : "#00F",
                yaxis: 1,
                shadowSize: 0
            }], {
            xaxis: {
                color : "#111",
                axisLabel : "Амплитуда немодулированного входного ВЧ-напряжения, мВ",
                min : 0,
                max : Emax,
                
                tickFormatter : function formatter(val, axis) {
                    var digits = axis.tickDecimals - 3 >= 0 ? axis.tickDecimals - 3 : 0;
                    return (val * 1e3).toFixed (digits);
                }
            },
            
            yaxis: {
                position: "left",
                color : "#111",
                axisLabel : "Постоянная составляющая выходного напряжения, мВ",
                
                tickFormatter : function formatter (val, axis) {
                    return (val * 1000).toFixed (axis.tickDecimals - 3);
               },
            },
            
            grid: {
                markings: [{ 
                    xaxis: { 
                        from: (this.Ek * (1 - this.m)), 
                        to: (this.Ek * (1 - this.m))
                    },
                        
                    color: "#222" 
                },{ 
                    xaxis: { 
                        from: (this.Ek * (1 + this.m)), 
                        to: (this.Ek * (1 + this.m))
                    },
                        
                    color: "#222" 
                }],
                
                markingsLineWidth: 1,
            }
        }, 1);      

        // ------------------------------------------------------------------------------------------------------------
        var kd = [];
        for (f = 100; f < 8100; f *= 1.05) {
           var Om = this.fnOmega (f, this.Ek, this.m);
        
           kd.push ([f, Om.K]);
        }
    
        var options1 = {
            series: {
                lines: { 
                    lineWidth: 2,
                }
            },
            
            xaxis: { 
                ticks: [[100, "100"], [200, "200"], [300, ""], [400, ""], [500, "500"], [600, ""], [700, ""], [800, ""], [900, ""], 
                        [1000, "1к"], [2000, "2к"], [3000, ""], [4000, ""], [5000, "5к"], [6000, ""], [7000, ""], [8000, ""], [9000, ""],
                        [10000, "10к"]],
                color : "#111",        
                axisLabel: "Частота модуляции &Omega;, Гц",                        
                transform: function (x) {
                    return Math.log (x + 0.0001); /*move away from zero*/
                }
            },
            
            yaxes: [{        
                position : "left",               
                axisLabel: "Коэффициент передачи k<sub>&Omega;</sub>",
                color : "#111",
            }],
            
            grid: { color: "#111" },
        };    
            
        this.plot ([{
             data : kd,
             color : "#11f",
             yaxis: 1,
             shadowSize : 0
        }], options1, 2);      
    });
}


$ (document).ready (function () {"use strict";
	Calc.init (crystal);
});
