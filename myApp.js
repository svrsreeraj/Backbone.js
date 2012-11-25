 $(function() {
        var UserModel = Backbone.Model.extend({
            url : function()  {
                var url   =   "test.php"
                if(!this.id)  return url;
                if(this.id)   return url + "?id=" + this.id;
            }
        });
        
        var DefaultDataModel    =   Backbone.Model.extend({
            url : "test.php",
            country : {},
            interest : {},
            users : {},
            initialize : function (){
                this.fetch({
                    success : function(model, resp)    {                        
                        console.log("Default data fetch Success")
                    },
                    error : function(model, resp)  {
                        console.log("Default data fetch error "+resp.statusText)
                    }
                });
            },
            parse   :   function(resp,xhr)
            {
                this.set("country",resp.country,{
                    silent:true
                });
                this.set("users",resp.users,{
                    silent:true
                });
                this.set("interest",resp.interest);
            }
        })
        
        var UserCollection  =   Backbone.Collection.extend({
            model : UserModel
        });

        var UserView = Backbone.View.extend({
            el:$("body"),

            initialize:function () {
                this.collection     =   new UserCollection();
                this.defaultData    =   new DefaultDataModel();
                this.itemToBeEdited =   null;
                this.defaultData.on("change", function (model, changes) {
                    if(model.get("users"))
                    {
                        this.collection.add(model.get("users"),{
                            silent:true
                        });
                        this.renderData(model, changes);
                    }
                    this.renderDefaultData(model, changes);
                }, this);
                this.collection.on("add change remove",this.renderData,this)
            },
            events:{
                "click #id_btn":"eventUpsert"
            },
            eventUpsert:function () 
            {
                if(this.itemToBeEdited)
                {
                    this.updateUser();
                }
                else
                {
                    this.insertUser();
                }
            },
            insertUser  :   function()  
            {
                var userModel = new UserModel();
                userModel.processFormData($("#id_frm_users"))
                this.collection.push(userModel);

                userModel.save(null, {
                    success: function(model, response){
                        console.log ("Model saved in server side");
                        
                    },
                    error: function(model, response){
                        console.log ("Model is not saved in server side");
                    }
                });
                console.log("Model Saved in client side")
                userRouter.navigate("/");
            },
            updateUser  :   function()
            {
                index   =   this.itemToBeEdited
                this.itemToBeEdited =   null
                
                model   =   this.collection.at(index)
                id      =   model.get("id");
                model.processFormData($("#id_frm_users"))
                model.set("id",id,{
                    silent:true
                });
                model.set("index",index,{
                    silent:true
                });
                model.save(null,{ 

                    success: function(model, response){
                        console.log ("Model Updated in server side");
                    },
                    error: function(model, response){
                        console.log ("Model is not updated in server side");
                    }
                })
                this.renderData()
                console.log ("Model Updated in client side");
                userRouter.navigate("/");
            },
            editUser  :   function(id)
            {
                if(this.collection.at(id))
                {
                    model   =   this.collection.at(id)
                    model.processModelData($("#id_frm_users"))
                    this.itemToBeEdited =   id;
                }
                else
                {
                       
                    var self   =   this;
                    var id     =   id;
                    setTimeout(function(){
                        self.editUser(id)
                    },100)
                }
                
                
            },
            deleteUser  :   function(id)
            {
                var model   =   this.collection.at(id);
                model.destroy({
                    success: function(model, response){
                        console.log ("Deleted from server side");
                    },
                    error: function(model, response){
                        console.log ("Delete error in server side");
                    }
                })
                console.log("Deleted from client side")
            },
            renderData  :   function(collection,changes)
            {
                $("#id_list").html('')
                console.log("Rendering data")
                this.collection.each(function(obj,index)
                {
                    if(obj.toJSON())
                    {
                        obj.set("index",index,{
                            silent:true
                        })
                        $("#id_list").append(_.template($("#list_template").html(),obj.toJSON()));
                    }
                },this)
            },
            renderDefaultData:function (model, changes) 
            {
                var countryString = _.map(model.get("country"),function (val) {
                    return( "<option value='" + val.id + "'>" + val.countryName + "</option>")
                }).join("\n")
                var InterestString = _.map(model.get("interest"),function (val) {
                    return( "<option value='" + val.id + "'>" + val.interestName + "</option>")
                }).join("\n")
                $("#sel_id_country").html(countryString);
                $("#sel_id_interest").html(InterestString);
            }
        });

        var UserRouter = Backbone.Router.extend({
            routes: {
                "delete/:id": "deleteUser",
                "edit/:id": "editUser"
            },
                deleteUser: function (id) {
                userView.deleteUser(id);
                this.navigate("#",{
                    replace: true
                })
            },
            editUser: function (id) {
                userView.editUser(id);
            }
        });
        
        var UserRouters = Backbone.Router.extend({
            routes: {
                "delete/:id": "deleteUser",
                "edit/:id": "editUser"
            },
            deleteUser: function (id) {
                userView.deleteUser(id);
                this.navigate("#",{
                    replace: true
                })
            },
            editUser: function (id) {
                userView.editUser(id);
            }
        });
        
        var userView = new UserView();
        var userRouter  =   new UserRouter();
        Backbone.history.start();
        
    });