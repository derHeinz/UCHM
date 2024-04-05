var nodes = [
    // use-cases/feature nodes (1xx)
    { id: 101, name: "put article\nto shopping cart", type: "feature", parent: 801 },
    { id: 102, name: "put service\nto shopping cart", type: "feature", parent: 801 },
    { id: 103, name: "add voucher", type: "feature", parent: 801 },

    { id: 110, name: "pay shopping cart\nwith paypal", type: "feature", parent: 802 },
    { id: 111, name: "pay shopping cart\nwith creditcard", type: "feature", parent: 802 },
    
    { id: 120, name: "send articles\nto user", type: "feature",},

    // service nodes (5xx)
    { id: 501, name: "webserver", type: "service" },
    { id: 502, name: "article\nservice", type: "service", parent: 1001 },
    { id: 503, name: "article\ndatabase", type: "service", parent: 1001 },
    { id: 504, name: "shopping-cart\nservice", type: "service" },
    { id: 505, name: "paypal\nconnector", type: "service" },
    { id: 506, name: "logistics\nservice", type: "service" },
    { id: 507, name: "email\nservice", type: "service" },
    { id: 508, name: "gutschein\nservice", type: "service" },
    { id: 509, name: "customer-data\nservice", type: "service" },
    { id: 510, name: "foreign-article\nservice", type: "service", parent: 1001 },

    // for parent nodes it is important that the higher the level the higher the ID needs to be.

     // these are the composite nodes for the features
    { id: 801, name: "fill shopping cart", type: "feature", parent: 901 },
    { id: 802, name: "pay shopping cart", type: "feature", parent: 901 },

    { id: 901, name: "shopping", type: "feature" },

    // these are composite nodes for services
    { id: 1001, name: "articles", type: "service" },
    
]

// only level 0 features have dependecies!!
var edges = [
    { from: 101, to: 501 },
    { from: 102, to: 501 },
    { from: 103, to: 501 },
    { from: 110, to: 501 },
    { from: 111, to: 501 },

    { from: 101, to: 502 },
    { from: 120, to: 502 },

    { from: 101, to: 503 },
    { from: 120, to: 503 },

    { from: 101, to: 504 },
    { from: 102, to: 504 },
    { from: 103, to: 504 },
    { from: 110, to: 504 },
    { from: 111, to: 504 },

    { from: 110, to: 505 },

    { from: 120, to: 506 },

    { from: 110, to: 507 },
    { from: 111, to: 507 },
    { from: 120, to: 507 },

    { from: 103, to: 508 },

    { from: 103, to: 509 },
    { from: 110, to: 509 },
    { from: 111, to: 509 },
    { from: 120, to: 509 },

    { from: 101, to: 510 },
  ];