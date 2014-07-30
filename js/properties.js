var search = JSON.parse('{"rental_prices":{"per_week":"725","accurate":"per_week","per_month":"3142"},"num_floors":"0","listing_status":"rent","num_bedrooms":"2","latitude":51.51935,"agent_address":"61 Southwark Street","property_type":"Flat","longitude":-0.105861,"thumbnail_url":"http://li.zoocdn.com/ae63a9fc49e9ee108ab8f1fb3ce86f97ee988ae3_80_60.jpg","description":"A beautifully proportioned, two double bedroom, two bathroom apartment in a sympathetic conversion of a magnificent gothic-styled period building. Over 900 square feet of accommodation is creatively arranged and comprises of a long, double width hallway off which there are two double bedrooms (one en-suite), a family bathroom, and a separate kitchen. The hallway ends with double doors on to the reception room. The proportions of the original building give the apartment a spacious feel. Furnishings and decorations are contemporary and understated.25 Farringdon Road has excellent transport connections thanks to nearby Farringdon Station which offers both Underground and Thameslink rail services. There are also bus services from Blackfriars to Kings Cross from outside the building. There is easy access on foot to Clerkenwell and The City to the East and Hatton Garden and Holborn to the West.BathroomBedroom 1Bedroom 2En-suite bathroomKitchenReception","post_town":"London","details_url":"http://www.zoopla.co.uk/to-rent/details/34027208?utm_source=v1:_aOLSmDUCBfb6xf8ebN-sCStLQQnhaLa&utm_medium=api","short_description":"A beautifully proportioned, two double bedroom, two bathroom apartment in a sympathetic conversion of a magnificent gothic-styled period building. Over 900 square feet of accommodation is creatively arranged and comprises of a long, double width hallway off which there are two double bedrooms ...","outcode":"EC1M","county":"London","price":"725","listing_id":"34027208","image_caption":"Reception","status":"to_rent","agent_name":"Dwell Residential","num_recepts":"0","country":"England","displayable_address":"Farringdon Road, London EC1M","first_published_date":"2014-07-29 21:08:56","floor_plan":["http://lc.zoocdn.com/8605d072260fd7d96ecd7e74bef16f72e7cba956.jpg"],"street_name":"London","num_bathrooms":"0","price_change":[{"date":"2014-07-29 19:05:53","price":"725"}],"agent_logo":"http://st.zoocdn.com/zoopla_static_agent_logo_(35997).data","agent_phone":"020 3318 6636","image_url":"http://li.zoocdn.com/ae63a9fc49e9ee108ab8f1fb3ce86f97ee988ae3_354_255.jpg","last_published_date":"2014-07-29 21:08:56"}');

$(function() {

  Parse.$ = jQuery;

  // Initialize Parse with your Parse application javascript keys
  Parse.initialize("5ITlOKP4A8ggw5KYLJnsHYyOoQ9CZydXeUDSqjiQ",
                   "lsm1ZGuKXFw1PLaU6WYHHSLN2o2V6FQd8675nfmi");

  // Property Model
  // ----------

  // The Property model represents a listing
  var Property = Parse.Object.extend("Property", {
    // Default attributes for the property.
    defaults: {
      content: "empty listing",
      hidden: false,
      starred: false,
      viewed: false,
    },

    // Ensure that each property created has `content`.
    initialize: function() {
      if (!this.get("content")) {
        this.set({"content": this.defaults.content});
      }
    },

    // Toggle the `starred` state of this property item.
    star: function() {
      this.save({starred: !this.get("starred")});
    },

    // Toggle the `hidden` state of this property item.
    hide: function() {
      this.save({hidden: !this.get("hidden")});
    },

    // Toggle the `starred` state of this property item.
    view: function() {
      this.save({viewed: !this.get("viewed")});
    }
  });

  // This is the transient application state, not persisted on Parse
  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

  // Property Collection
  // ---------------

  var PropertyList = Parse.Collection.extend({

    // Reference to this collection's model.
    model: Property,

    // Filter down the list of all property items that have been viewed.
    viewed: function() {
      return this.filter(function(property){ return property.get('viewed'); });
    },

    // Filter down the list to only property items that are still not viewed.
    unviewed: function() {
      return this.without.apply(this, this.viewed());
    },

     // Filter down the list of all property items that are hidden.
    hidden: function() {
      return this.filter(function(property){ return property.get('hidden'); });
    },

    // Filter down the list to only property items that are not hidden.
    potential: function() {
      return this.without.apply(this, this.hidden());
    },

      // Filter down the list of all property items that are starred.
    starred: function() {
      return this.filter(function(property){ return property.get('starred'); });
    },

    // We keep the Properties in sequential order, despite being saved by unordered
    // GUID in the database. This generates the next order number for new items.
    nextOrder: function() {
      if (!this.length) return 1;
      return this.last().get('order') + 1;
    },

    // Properties are sorted by their original insertion order.
    comparator: function(property) {
      return property.get('order');
    }

  });

  // Property Item View
  // --------------

  // The DOM element for a property item...
  var PropertyView = Parse.View.extend({

    //... is a list tag.
    tagName:  "li",

    // Cache the template function for a single item.
    template: _.template($('#item-template').html()),

    // The DOM events specific to an item.
    events: {
      "click .markview"              : "toggleViewed",
      "click .star"              : "toggleStar",
      "click .hide"              : "toggleHidden",
      "dblclick label.property-content" : "edit",
      "click .property-destroy"   : "clear",
      "keypress .edit"      : "updateOnEnter",
      "blur .edit"          : "close"
    },

    // The PropertyView listens for changes to its model, re-rendering. Since there's
    // a one-to-one correspondence between a Property and a PropertyView in this
    // app, we set a direct reference on the model for convenience.
    initialize: function() {
      _.bindAll(this, 'render', 'close', 'remove');
      this.model.bind('change', this.render);
      this.model.bind('destroy', this.remove);
    },

    // Re-render the contents of the property item.
    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.input = this.$('.edit');
      return this;
    },

    // Toggle the `"star"` state of the model.
    toggleStar: function() {
      this.model.star();
    },

    // Toggle the `"hidden"` state of the model.
    toggleHidden: function() {
      this.model.hide();
    },

    // Toggle the `"viewed"` state of the model.
    toggleViewed: function() {
      this.model.view();
    },

    // Switch this view into `"editing"` mode, displaying the input field.
    edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
    },

    //TODO: Close the `"editing"` mode, saving changes to the property.
    close: function() {
      this.model.save({content: JSON.parse(this.input.val())});
      $(this.el).removeClass("editing");
    },

    // If you hit `enter`, we're through editing the item.
    updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
    },

    // Remove the item, destroy the model.
    clear: function() {
      this.model.destroy();
    }

  });

  // The Application
  // ---------------

  // The main view that lets a user manage their property items
  var ManagePropertiesView = Parse.View.extend({

    // Our template for the line of statistics at the bottom of the app.
    statsTemplate: _.template($('#stats-template').html()),

    // Delegated events for creating new items, and clearing completed ones.
    events: {
      "keypress #new-property":  "createOnEnter",
      "click #clear-hidden": "clearHidden",
      "click #view-all": "toggleAllViewed",
      "click .log-out": "logOut",
      "click ul#filters a": "selectFilter"
    },

    el: ".content",

    // At initialization we bind to the relevant events on the `Properties`
    // collection, when items are added or changed. Kick things off by
    // loading any preexisting properties that might be saved to Parse.
    initialize: function() {
      var self = this;

      _.bindAll(this, 'addOne', 'addAll', 'addSome', 'render', 'toggleAllViewed', 'logOut', 'createOnEnter');

      // Main property management template
      this.$el.html(_.template($("#manage-properties-template").html()));
      
      this.input = this.$("#new-property");
      this.allViewIcon = this.$("#view-all")[0];

      // Create our collection of Properties
      this.properties = new PropertyList;

      // Setup the query for the collection to look for properties from the current user
      this.properties.query = new Parse.Query(Property);
      this.properties.query.equalTo("user", Parse.User.current());
        
      this.properties.bind('add',     this.addOne);
      this.properties.bind('reset',   this.addAll);
      this.properties.bind('all',     this.render);

      // Fetch all the properties items for this user
      this.properties.fetch();

      state.on("change", this.filter, this);
    },

    // Logs out the user and shows the login view
    logOut: function(e) {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    // Re-rendering the App just means refreshing the statistics -- the rest
    // of the app doesn't change.
    render: function() {
      var starred = this.properties.starred().length;
      var hidden = this.properties.hidden().length;
      var unviewed = this.properties.unviewed().length;

      this.$('#property-stats').html(this.statsTemplate({
        total:      this.properties.length,
        starred:    starred, 
        hidden:     hidden,
        unviewed:   unviewed
      }));

      this.delegateEvents();

      this.allViewIcon.checked = !unviewed;
    },

    // Filters the list based on which type of filter is selected
    selectFilter: function(e) {
      var el = $(e.target);
      var filterValue = el.attr("id");
      state.set({filter: filterValue});
      Parse.history.navigate(filterValue);
    },

    filter: function() {
      var filterValue = state.get("filter");
      this.$("ul#filters a").removeClass("selected");
      this.$("ul#filters a#" + filterValue).addClass("selected");
      if (filterValue === "all") {
        this.addAll();
      } else if (filterValue === "starred") {
        this.addSome(function(item) { return item.get('starred') });
      } else if (filterValue === "hidden") {
        this.addSome(function(item) { return item.get('hidden') });
      } else if (filterValue === "unviewed") {
        this.addSome(function(item) { return !item.get('viewed') });
      } else {
        this.addSome(function(item) { return !item.get('hidden') });
      }
    },

    // Resets the filters to display all properties
    resetFilters: function() {
      this.$("ul#filters a").removeClass("selected");
      this.$("ul#filters a#all").addClass("selected");
      this.addAll();
    },

    // Add a single property item to the list by creating a view for it, and
    // appending its element to the `<ul>`.
    addOne: function(property) {
      var view = new PropertyView({model: property});
      this.$("#property-list").append(view.render().el);
    },

    // Add all items in the Properties collection at once.
    addAll: function(collection, filter) {
      this.$("#property-list").html("");
      this.properties.each(this.addOne);
    },

    // Only adds some properties, based on a filtering function that is passed in
    addSome: function(filter) {
      var self = this;
      this.$("#property-list").html("");
      this.properties.chain().filter(filter).each(function(item) { self.addOne(item) });
    },

    // If you hit return in the main input field, create new Property model
    createOnEnter: function(e) {
      var self = this;
      if (e.keyCode != 13) return;

      this.properties.create({
        //TODO:
        content:         JSON.parse(this.input.val()),
        order:           this.properties.nextOrder(),
        hidden:          false,
        starred:         false,
        viewed:          false,
        user:            Parse.User.current(),
        ACL:             new Parse.ACL(Parse.User.current())
      });

      this.input.val('');
      this.resetFilters();
    },

    // Clear all hidden property items, destroying their models.
    clearHidden: function() {
      _.each(this.properties.hidden(), function(property){ property.destroy(); });
      return false;
    },

    toggleAllViewed: function () {
      var viewed = this.allViewIcon.checked;
      this.properties.each(function (property) { property.save({'viewed': viewed}); });
    }
  });

  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "submit form.signup-form": "signUp"
    },

    el: ".content",
    
    initialize: function() {
      _.bindAll(this, "logIn", "signUp");
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var email = this.$("#login-email").val();
      var password = this.$("#login-password").val();
      
      Parse.User.logIn(email, password, {
        success: function(user) {
          new ManagePropertiesView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".login-form .error").html("Invalid email or password. Please try again.").show();
          self.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    signUp: function(e) {
      var self = this;
      var email = this.$("#signup-email").val();
      var username = email;
      var password = this.$("#signup-password").val();
      
      Parse.User.signUp(username, password, { ACL: new Parse.ACL() }, {
        success: function(user) {
          new ManagePropertiesView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".signup-form .error").html(error.message).show();
          self.$(".signup-form button").removeAttr("disabled");
        }
      });

      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  // The main view for the app
  var AppView = Parse.View.extend({
    // Instead of generating a new element, bind to the existing skeleton of
    // the App already present in the HTML.
    el: $("#propertyapp"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        new ManagePropertiesView();
      } else {
        new LogInView();
      }
    }
  });

  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "starred": "starred",
      "hidden": "hidden",
      "unviewed": "unviewed"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    starred: function() {
      state.set({ filter: "starred" });
    },

    hidden: function() {
      state.set({ filter: "hidden" });
    },

    unviewed: function() {
      state.set({ filter: "unviewed" });
    }
  });

  var state = new AppState;

  new AppRouter;
  new AppView;
  Parse.history.start();
});