Diodes = {
 /*  'Д2' : {
        TYPE: 'Ge',
        IS : 1.9e-6,
        RS : 72,
        XTI : 3, // ?
        N : 2.5,
        EG : 0.6,
        GMIN : 3.8e-6, // ?
        VJ : 0.7,
        M : 0.39, 
        BV : 500, // ?
        IBV : 0, // ?
        CJ0 : 4e-13,
        FC : 0, // ?
        TT : 6.5e-7 // ?               
    },*/
    'ideal' : {
        TYPE: 'ideal',
        IS : 0,
        RS : 0,
        XTI : 1, // by default
        N : 1e-12,
        EG : 0.0,
        GMIN : 1e-12,
        VJ : 0.0,
        M : 0.0, 
        BV : 1e3,
        IBV : 0,
        CJ0 : 0,
        FC : 0,
        TT : 0
    },    
    '1N34A' : { // http://broeselsworld.de/sonstiges/Detektor/spice/models/CrystalRadioDiodes.lib
        TYPE: 'Ge p-n',
        IS : 2e-7,
        RS : 7,
        XTI : 3, // by default
        N : 1.3,
        EG : 0.67,
        GMIN : 1.5e-6, // обратный ток 15-30 мкА при 10В
        VJ : 0.1,
        M : 0.27, 
        BV : 75,
        IBV : 18e-3,
        CJ0 : 0.5e-12,
        FC : 0.5, // by default
        TT : 0 // by default
    },
    'FO-215' : { // http://www.theradioboard.com/rb/viewtopic.php?p=16891
        TYPE: 'Ge p-n',
        IS : 110e-9,
        RS : 30,
        XTI : 3, // by default
        N : 1.02,
        EG : 0.67,
        GMIN : 3.6e-8,
        VJ : 0.1,
        M : 0.27,
        BV : 23,
        IBV : 100e-6,
        CJ0 : 2.9e-12,
        FC : 0.5,
        TT : 70e-9
    },    
    '1N4148' : { // http://users.skynet.be/hugocoolens/spice/diodes/1n4148.htm
        TYPE: 'Si p-n',
        IS : 4.35e-9,
        RS : 0.65,
        XTI : 3,
        N : 1.9,
        EG : 1.16,
        GMIN : 1.25e-9, // 25 нА при 20 В, 1.7e-10
        VJ : 0.87,
        M : 0.73, 
        BV : 110,
        IBV : 1e-4,
        CJ0 : 7e-13,
        FC : 0.5,
        TT : 3.5e-9
    },       
    '5082-2835' : { // http://broeselsworld.de/sonstiges/Detektor/spice/models/CrystalRadioDiodes.lib
        TYPE: 'Si Schottky',
        IS : 1e-8,
        RS : 5,
        XTI : 2,
        N : 1.04,
        EG : 0.69,
        GMIN : 1e-7, // 100 нА при 1 В
        VJ : 0.46,
        M : 0.5,
        BV : 20,
        IBV : 10e-5,
        CJ0 : 0.82e-12,
        FC : 0.5, // by default
        TT : 0    
    },    
    'BAT15-03W' : { // http://broeselsworld.de/sonstiges/Detektor/spice/models/CrystalRadioDiodes.lib
        TYPE: 'Si Schottky',
        IS : 130e-9,
        RS : 4.5,
        XTI : 1.8,
        N : 1.08,
        EG : 0.68,
        GMIN : 5e-7, // 1 мкА при 2 В
        VJ : 0.11,
        M : 0.047,
        BV : 4,
        IBV : 10e-6,
        CJ0 : 260e-15,
        FC : 0.5,
        TT : 25e-12
    },          
    'BAT46W' : { // http://broeselsworld.de/sonstiges/Detektor/spice/models/CrystalRadioDiodes.lib
        TYPE: 'Si Schottky',
        IS : 600e-9,
        RS : 0.28,
        XTI : 2, // by default
        N : 1.7,
        EG : 0.68, // by default
        GMIN : 3.3e-7, // 0.5 мкА при 1.5 В, 0.8 мкА при 10 В, 2 мкА при 50 В
        VJ : 0.11, // by default
        M : 0.33,
        BV : 100,
        IBV : 5e-6,
        CJ0 : 8e-12,
        FC : 0.5, // by default
        TT : 7.2e-9
    },       
    'BAT62' : { // http://broeselsworld.de/sonstiges/Detektor/spice/models/CrystalRadioDiodes.lib
        TYPE: 'Si Schottky',
        IS : 120e-9,
        RS : 200,
        XTI : 1.8,
        N : 1.04,
        EG : 0.68,
        GMIN : 2.5e-7, // => 10 мкА при 40 В; 3e-8 recommended
        VJ : 0.4,
        M : 0.14,
        BV : 40,
        IBV : 5e-6,
        CJ0 : 3.5e-13,
        FC : 0.5,
        TT : 25e-12
    }, 
    'BAT85' : { // http://broeselsworld.de/sonstiges/Detektor/spice/models/CrystalRadioDiodes.lib
        TYPE: 'Si Schottky',
        IS : 2.1e-7,
        RS : 2.6,
        XTI : 2,
        N : 1.02,
        EG : 0.69,
        GMIN : 8e-8, // 2 мкА при 25 В
        VJ : 0.2,
        M : 0.39,
        BV : 36,
        IBV : 1.2e-6,
        CJ0 : 1.1e-11,
        FC : 0,
        TT : 0
    }, 
    'SD101B' : { // http://broeselsworld.de/sonstiges/Detektor/spice/models/CrystalRadioDiodes.lib
        TYPE: 'Si Schottky',
        IS : 200e-9,
        RS : 2.8,
        XTI : 2, // by default
        N : 1.7,
        EG : 0.68, // by default
        GMIN : 7e-9, // 200 нА при 30 В
        VJ : 0.11, // by default
        M : 0.33,
        BV : 50,
        IBV : 1.8e-6,
        CJ0 : 2.7e-12,
        FC : 0.5, // by default
        TT : 1.4e-9
    },
};