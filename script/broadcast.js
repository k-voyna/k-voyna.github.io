/*jslint plusplus: true */
/*global Phys: true, Calc: true, Complex: true */
/*global IdealIsotropicRadiator: true, IdealMonopoleRadiator: true, MonopoleRadiator: true */
/*global Grounds: true, Plots: true */

// TODO: Использовать реальные критерии, помеховую обстановку, наличие соедних передатчиков, Город, пригород, загород
// TODO: Уточнить фазы при интерференции (сдвиг фаз поверхностной в частности)
// TODO: Ввод эквивалентной SIGMA и F
// TODO: Мёртвое море 27 проводимость
// TODO: Отсортировать по важности влияния
// TODO: Отдельный тип поверхности в конце трассы
// TODO: Два типа поверхности, в конце и начале, средине
// TODO: Выбор проводимости земной по карте
// TODO: Антены мощных СВ и ДВ радиостанций
// TODO: Антенна Александерсена
// TODO: Поправки для ионосферной волны
// TODO: Поправки для кривизны земной поверхности
// TODO: Поправки для высоты над уровнем моря
// TODO: Поправки для рельефа и т.п.
// TODO: Произвольные антенны
// TODO: Многоскачковое распространение
// TODO: Данные ITU-R
function crystal () {"use strict";
    var broadcast; 
    
    // ----------------------------------------------------- broadcast --------------------------------------------------
    broadcast = Calc.calc ({
        name : "broadcast",
        input : {
            f : [1e3],
            PERP : [1e3],
            PTPO : [1e3],
            power : ['TPO', 'ERP'],
            
            D : [1e3],
            H : [1e3],
            
            ground : ['mountains', 'polar ice', 'forest', 'sandy soil', 'dry soil', 'wet soil', 'fresh water', 'sea water', '!'],
            ground_sigma : [1e-3],
            ground_eps : [1e0],
            
            time : ['day', 'night'],
            antenna: ['.', '0.01',  '0.25', '0.53' , '0.625'],
                        
            CCIR : ['n', 'y'],
            CCIR_W : [],
            CCIR_T : [16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7],
            CCIR_M : [50, 55, 60, 65, 70, 75],
            CCIR_P : [1, 10, 50, 90, 99]
        },
        output : {
            lambda : [1e0, 3],
            sigma : [1e+0, 2, "exp"],
            sigma1MHz : [1e+0, 2, "exp"],
            eps : [1e+0, 2],
            Pi : [1e0, 2, "exp"],
            P_EIRP : [1e3, 2],
            P_ERP : [1e3, 2],
            E0 : [1e-3, 2],
            Es : [1e-3, 2],
            Eg : [1e-3, 2],
            Fo : [1e0, 2, "exp"],
            Emin : [1e-3, 2],
            phi : [Math.PI / 180, 2],
            gamma : [Math.PI / 180, 2],
            hs : [1e3, 2],
            E : [1e-3, 2],
            Da : [1e-1, 2],
            DCCIR : [1e-1, 2],
            Dn : [1e-1, 2],
            Ds : [1e-1, 2],
            Do : [1e-1, 2],
            Dg : [1e-1, 2],
            Dt : [1e-1, 2],
            DE : [1e-1, 1],
            etaa : [1e-2, 2],
            dfa : [1e3, 2],
            D1 : [1e3, 2],
            dd : [1e3, 2],
            dn50s : [1e3, 2],
            dn50f : [1e3, 2]
        }
    }, function () {       
        // проверка входных значений       
        this.check (this.f >= 150e3 && this.f <= 2e6, "f");
        this.check (this.D >= 1e3 && this.D <= 10e6, "D");
        this.check (this.time === 'day' || (this.H >= 90e3 && this.H <= 120e3), "H");

        // длина волны
        this.lambda = Phys.C / this.f;
        
        if (this.ground !== '!') {
            var ground = Grounds [this.ground];
            
            this.sigma = ground.sigma;
            this.eps = ground.eps;        
        } else {
            this.check (this.ground_sigma > 0 && this.ground_sigma < 10, "ground_sigma");
            this.check (this.ground_eps >= 1 && this.ground_eps <= 100, "ground_eps");
            
            this.sigma = this.ground_sigma;
            this.eps = this.ground_eps;
        }
        
        var omega = 2 * Math.PI * this.f;
        this.sigma1MHz = new Complex (this.sigma, omega * Phys.EPS0 * this.eps).mod ();
                
        // антенна передатчика
        var antenna;
        switch (this.antenna) {
            case '.':
                antenna = new IdealIsotropicRadiator ().fn (this.lambda);
                break;

            case '0.01':
                antenna = new IdealMonopoleRadiator (this.lambda * 0.01, 0.05).fn (this.lambda);
                antenna.eta = 1 / antenna.D ();
                break;
                              
            case '0.25':
                antenna = new IdealMonopoleRadiator (this.lambda * 0.25, 0.05).fn (this.lambda);
                break;
                
            case '0.53':
                antenna = new IdealMonopoleRadiator (this.lambda * 0.53, 0.05).fn (this.lambda);
                break;

            case '0.625':
                antenna = new IdealMonopoleRadiator (this.lambda * 0.625, 0.05).fn (this.lambda);
                break;
        }

        if (this.power === 'ERP') {
            this.check (this.PERP > 0 && this.PERP <= 10e6, "PE");
            this.P_ERP = this.PERP;
            this.P_EIRP = this.PERP * 1.5;
            this.P = this.P_EIRP / antenna.D ();            
        } else {
            this.check (this.PTPO > 0 && this.PTPO <= 10e6, "PTPO");
            this.P = this.PTPO;
            this.P_EIRP = antenna.D () * this.P;
            this.P_ERP = this.P_EIRP / 1.5;
        }
        
        this.dfa = this.f / (antenna.Q + Math.abs (antenna.Z.y / antenna.Z.x));
        this.Da = Math.log10 (antenna.D ());
               
        // рассчет напряженности поля поверхностной волны
        function fnEg (lambda, P, d, fnD, sigma, eps) {
            var E0 = Groundwave.E0 (P, d, fnD, Math.PI / 2);
            var Fg = Groundwave.GroundFactor (lambda, d, sigma, eps);
            var Fn = Groundwave.NearFieldFactor (lambda, d);
            var Fd = Groundwave.DiffractionFactor (lambda, d, sigma, eps);
            
            return E0 * Fg * Fn * Fd;
        }
        /*
        function fnEg1 (lambda, P, d, fnD, sigma, eps) {
            var E0 = Groundwave.E0 (P, d, fnD, Math.PI / 2);
            var Fg = Groundwave.GroundFactor (lambda, d, sigma, eps);
            var Fn = Groundwave.NearFieldFactor (lambda, d);
            var Fd = Groundwave.FokFactor (lambda, d, sigma, eps);
            
            return E0 * Fd;
        }       
        */
        this.E0 = Groundwave.E0 (this.P, this.D, antenna.fnD, Math.PI / 2);
        this.Eg = fnEg (this.lambda, this.P, this.D, antenna.fnD, this.sigma, this.eps);
               
        this.Dn = 2 * Math.log10 (Groundwave.NearFieldFactor (this.lambda, this.D));        
        this.Dg = 2 * Math.log10 (Groundwave.GroundFactor (this.lambda, this.D, this.sigma, this.eps));
        this.Do = 2 * Math.log10 (Groundwave.DiffractionFactor (this.lambda, this.D, this.sigma, this.eps));
              
        // рассчет напряженности поля ионосферной волны. 
        // Формула ММКР + учет ДН передающей антенны + учет поляризации при вторичном отражении от земли (см. Надененко)
        function fnSkywaveE (lambda, P, fnD, D, H, sigma, eps, Fx) {
            // угол излучения/падения
            var Theta = Skywave.ZenithAngle (D, H);
            
            // излучаемая мощность
            var PEIRP = P * fnD (Theta);
            
            // волнодвижущая сила
            var EE = Math.sqrt ((Phys.Z0 / (2 * Math.PI)) * PEIRP);

            // поправка на зависимость ослабления от дальности распространения и длины волны
            var Fd = Skywave.DistanceFactor (lambda, D);
                        
            // коэффициент, учитывающий взаимокомпенсацию падающей и отраженной от поверхности земли волн (по Надененко)
            // играет роль при малых зенитных углах
            // TODO: Учитывать проводимость земли
            var Ft = Math.sin (Theta); // ~ Math.sqrt (1 - Math.cos (2 * Theta)) / Math.sqrt (2);
            
            // геометрическая модель + поправка на дальность от CCIR
            return Fd * Fx * Ft * EE / Skywave.BeamDistance (D, H);
            
            // эмпирическая формула CCIR + поправка на взаимокомпенсацию падающей и отраженной волн
            // return Fd * Fx * Ft * EE * (0.010233 / Math.sqrt (Phys.Z0 / (2 * Math.PI))) / Math.sqrt (D);
        }
      
        // центральный угол
        this.gamma = this.D / Phys.Re;
        // предельная дальность односкачкового распространения
        this.D1 = Skywave.SingleHopMaximalDistance (this.H);
        // высота шарового сегмента 
        this.hs = Phys.Re * (1 - Math.cos (this.gamma / 2));      
        // угол падения ионосферной волны
        this.phi = Math.PI / 2 - Skywave.ZenithAngle (this.D, this.H);
                
        // поправки CCIR на напряженность поля пространственной волны
        var CCIR = 1;
        if (this.CCIR === 'y') {
            this.check (this.CCIR_W > 0 && this.CCIR_W < 300, "CCIR_W");
 
            CCIR = Skywave.CCIRFactor (this.CCIR_M, this.CCIR_T, this.CCIR_P, this.CCIR_W, this.D);
        }
        
        this.DCCIR = 2 * Math.log10 (CCIR);
        this.Ds = 2 * Math.log10 (Skywave.DistanceFactor (this.lambda, this.D));
        this.Dt = 2 * Math.log10 (Math.cos (this.phi));
        
        // напряженность пространственной волны        
        this.Es = fnSkywaveE (this.lambda, this.P, antenna.fnD, this.D, this.H, this.sigma, this.eps, CCIR);
       
        // Напряженность поля при интерференции двух волн        
        function fnInterference (E1, E2, lambda, d1, d2, alpha) {
            var phi = 2 * Math.PI / lambda * (d1 - d2);
            
            return Math.sqrt (Math.pow (E1, 2) + Math.pow (E2, 2) + 2 * E1 * E2 * Math.cos (alpha) * Math.cos (phi));
        }       
       
        // суммарная напряженность поля земной и ионосферной волны
        this.E = (this.time === "day") 
            ? this.Eg // день
            : fnInterference (this.Eg, this.Es, this.lambda, 0, 0, Math.PI); // ночь

        if (this.time === 'day') {
            this.E = this.Eg;
            this.DE = 0;
        } else {
            var Emax = Math.sqrt (Math.pow (this.Eg, 2) + Math.pow (this.Es, 2) + 2 * this.Es * this.Eg);
            var Emin = Math.sqrt (Math.pow (this.Eg, 2) + Math.pow (this.Es, 2) - 2 * this.Es * this.Eg);
            this.E = (Emax + Emin) / 2;
            this.DE = 2 * Math.log10 (Emax / Emin);
        }
            
        // минимальная напряженность для уверенного приема (Выходец А. Справочник по радиовещанию, с. 76)
        this.Emin = 1e-3 * (1e6 / this.f);

        // принимаемая мощность в изотропной идеальной антенне
        this.Pi = Math.pow (this.lambda * this.E / (2 * Math.PI), 2) / (Phys.Z0 / Math.PI);
        
        // E должно быть достаточно для уверенного приема
        this.suggest (this.E >= this.Emin, "Emin");
                
        // защитное отношение между земной и пространственной волнами 8 дБ (Выходец А. Справочник по радиовещанию, с. 76)
        this.suggest (this.time === "day" || 20 * Math.abs (Math.log10 (this.Es) - Math.log10 (this.Eg)) > 8, "DE");
                      
        var Es = [];
        var Eg = [];
        var Ei = [];
        var Ef = [];
        
        // расчет зависимости E=f(D) и границ зон уверенного приема
        for (var D = 1e3; D <= 10000e3; D = Math.pow (D, 1.002)) {
            var FCCIR = (this.CCIR === 'y') ? Skywave.CCIRFactor (this.CCIR_M, this.CCIR_T, this.CCIR_P, this.CCIR_W, D) : 1;
            var vEs = fnSkywaveE (this.lambda, this.P, antenna.fnD, D, this.H, this.sigma, this.eps, FCCIR);
            var vEg = fnEg (this.lambda, this.P, D, antenna.fnD, this.sigma, this.eps);
            // var vEf = fnEg1 (this.lambda, this.P, D, antenna.fnD, this.sigma, this.eps);
            
            // граница зоны 50%-замираний
            if (vEg < vEs * 2) {
                if (this.dn50s === undefined)
                    this.dn50s = D;
            }
            
            if (vEs > vEg * 2) {
                if (this.dn50s !== undefined && this.dn50f === undefined)
                    this.dn50f = D;
            }

            // граница зоны уверенного приема
            if (vEg < this.Emin && this.dd === undefined) {
                this.dd = D;
            }
            
            Es.push ([D, vEs]);
            Eg.push ([D, vEg]);
            // Ef.push ([D, vEf]);
            
            // учитываем разность хода волн
            Ei.push ([D, fnInterference (vEg, vEs, this.lambda, D, Skywave.BeamDistance (D, this.H), 0)]);                
        }
        
        var data = (this.time === "day")
            ? [Plots.dataC (Eg, "Земная волна"),
              // Plots.dataB (Ef, "Земная волна по Фоку")
               ]
            : [ Plots.dataA (Eg, "Земная волна"), 
                Plots.dataB (Es, "Ионосферная волна"),
                Plots.dataC (Ei, "Суперпозиция волн")
              ];
        
        this.plot (data, {
            xaxis: Plots.logD (), 
            yaxis: Plots.logE (),
            
             grid: {
                markings: [{ 
                    yaxis: { 
                        from: this.Emin, 
                        to: this.Emin
                    },
                        
                    color: "#272" 
                }],
                
                markingsLineWidth: 1
            }
        }, 1);
        
        // расчет диаграммы направленности           
        this.plot (Plots.radiationPatternData (antenna.fnD, antenna.D ()), Plots.radiationPatternAxes (), 0);            
    });
}

$ (document).ready (function () {"use strict";
    Calc.init (crystal);
});
