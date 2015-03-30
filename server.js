var http = require('http');
var static = require('node-static');

var Items = function() {
    this.items = [];
    this.id = 0;
};

Items.prototype.add = function(name) {
    var item = {name: name, id: this.id};
    this.items.push(item);
    this.id += 1;
    return item;
};

Items.prototype.edit = function(item) {
    var newItem = {};

    // Try to locate the item in the list
    var items = this.items.filter(function(entry) {
        if (entry.id === item.id) {
            entry.name = item.name;
            return true;
        }
    });

    if (items.length) {
        // The item was found - just return it
        return item;
    } else {
        // The item was not located in the list, so add it as a new item
        newItem = this.add(item.name);
        newItem.id = item.id;
        return newItem;
    }
};

Items.prototype.delete = function(itemId) {
    var item;
    this.items = this.items.filter(function(entry) {
        if (entry.id === itemId) {
            item = entry;
        }
        return entry.id !== itemId;
    });
    return item;
};

var items = new Items();
items.add('Broad beans');
items.add('Tomatoes');
items.add('Peppers');

var fileServer = new static.Server('./public');

var server = http.createServer(function (req, res) {
    if (req.method === 'GET' && req.url === '/items') {
        var responseData = JSON.stringify(items.items);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(responseData);
    } else if (req.method === 'POST' && req.url === '/items') {
        var item = '';
        req.on('data', function(chunk) {
            item += chunk;
        });
        req.on('end', function() {
            try {
                item = JSON.parse(item);
                item = items.add(item.name);
                res.statusCode = 201;
                res.end(JSON.stringify(item));
            }
            catch(e) {
                res.statusCode = 400;
                responseData = {'message': 'Invalide JSON'};
                res.end(JSON.stringify(responseData));
            }
        })
    } else if (req.method === 'PUT' && req.url.indexOf('/items') > -1) {
        var item = '';
        req.on('data', function(chunk) {
            item += chunk;
        });
        req.on('end', function() {
            try {
                item = JSON.parse(item);
                item = items.edit(item);
                res.statusCode = 201;
                res.end(item);
            }
            catch(e) {
                res.statusCode = 400;
                responseData = {'message': 'Invalide JSON'};
                res.end(JSON.stringify(responseData));
            }
        })
    } else if (req.method === 'DELETE' && req.url.indexOf('/items') > -1) {
        var id = req.url.split('/')[2],
            item = items.delete(parseInt(id));

        try {
            if (!item) throw "Invalid item id";
            res.statusCode = 201;
            res.end(JSON.stringify(item));
        } catch (e) {
            res.statusCode = 400;
            responseData = {'message': e};
            res.end(JSON.stringify(responseData));
        }
    } else {
        fileServer.serve(req, res);
    }
});

server.listen(8080, function() {
    console.log('listening on localhost:' + 8080);
});