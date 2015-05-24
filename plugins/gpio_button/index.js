if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

define([ 'pi-gpio' ], function(gpio) {

  /**
   * Gpio Button Plugin. Can simulate short click (on/off)
   *
   * @class GpioButton
   * @param {Object} app The express application
   * @constructor 
   */
  var GpioButton = function(app) {

    this.name = 'GpioButton';
    this.collection = 'GpioButton';
    this.icon = 'icon-ok';

    this.app = app;
    this.id = 'gpio_button';
    this.pluginHelper = app.get('plugin helper');

    this.values = {};

    var that = this;

    app.get('sockets').on('connection', function(socket) {
      // GPIO toggle
      socket.on('gpio-click', function(data) {
        that.click(data);
      });

    });
  };

  /**
   * Click a GPIO port
   *
   * @method click
   * @param {Object} data The websocket data
   * @param {String} data.id The ID of the database entry
   * @param {String} data.value The value to set
   */
  GpioButton.prototype.click = function(data) {
    var that = this;
    this.pluginHelper.findItem(this.collection, data.id, function(err, item, collection) {
      gpio.open(parseInt(item.pin), "output", function(err) {
        gpio.write(parseInt(item.pin), 1, function() {
          setTimeout(function() {
            gpio.write(parseInt(item.pin), 0, function() {
              gpio.close(parseInt(item.pin));
            });
          }, item.duration || 100);
        });
      });
    });
  };

  /**
   * Manipulate the items array before render
   *
   * @method beforeRender
   * @param {Array} items An array containing the items to be rendered
   * @param {Function} callback The callback method to execute after manipulation
   * @param {String} callback.err null if no error occured, otherwise the error
   * @param {Object} callback.result The manipulated items
   */
  GpioButton.prototype.beforeRender = function(items, callback) {
    var that = this;
    items.forEach(function(item) {
      item.value = that.values[item._id] ? that.values[item._id] : 0;
    });
    return callback(null, items);
  };

  /**
   * API functions of the GPIO Button Plugin
   * 
   * @method api
   * @param {Object} req The request
   * @param {Object} res The response
   */

  GpioButton.prototype.api = function(req, res, next) {
    /*
     * GET
     */
    if (req.method == 'GET') {
      var that = this;
      this.app.get('db').collection(this.collection, function(err, collection) {
        collection.find({}).toArray(function(err, items) {
          if (!err) {
            that.beforeRender(items, function() {
              res.send(200, items);
            });
          } else {
            res.send(500, '[]');
          }
        });
      });
    } else {
      next();
    }
  };

  var exports = GpioButton;

  return exports;

});
