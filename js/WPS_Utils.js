/**
 * api: (define) module = GEOR class 
 */
Ext.namespace("GEOR");

GEOR.WPS_Utils = (function() {

        workspace =  null;
       
        layerName = null;

        serverStore = null;

        


	return {
		/**
		 * Init the workspace store
		 * */
		initServerStore : function() {
			serverStore = new Ext.data.Store({
				proxy : new Ext.data.HttpProxy({
					url : GEOR.util
							.getValidURI(GEOR.config.OGC_SERVERS_URL["WMS"]),
					method : 'GET',
					disableCaching : false
				}),
				reader : new Ext.data.JsonReader({
					fields : [ 'name', 'url' ],
					root : 'servers'
				})
			});
			serverStore.load();
			return serverStore;
		},

		/**
		 * combobox declaration 
		 * */
		initCombobox : function(id, datastore, fieldLabel, valueField,
				displayField, disabled) {
			combo = new Ext.form.ComboBox(
					{
						id : id,
						editable : true,
						triggerAction : 'all',
						height : 30,
						width : 200,
						disabled : disabled,
						fieldLabel : fieldLabel,
						loadingText : tr("Loading..."),
						mode : 'local',
						store : datastore,
						valueField : valueField,
						displayField : displayField,
						tpl : '<tpl for="."><div ext:qtip="<b>{name}</b><br/>{url}" class="x-combo-list-item">{name}</div></tpl>'
					});

			return combo;
		},

		/**
		 * load the data store of the corresponding combo
		 * */
		loadNextDataStore : function(combo, url, corespondingCombo) {
			var records_Layer = [];
			var modelCmp;
			var layersRecord = Ext.data.Record.create([ {
				name : 'name',
				mapping : 'name'
			}, {
				name : 'layer',
				mapping : 'layer'
			} ]);

			OpenLayers.Request.GET({
				url : url,
				params : {
					SERVICE : 'WMS',
					VERSION : '1.1.3',
					REQUEST : 'GetCapabilities'
				},
				success : function(r) {
					var doc = r.responseXML;
					if (!doc || !doc.documentElement) {
						doc = r.responseText;
					}
					var format = new OpenLayers.Format.WMSCapabilities();

					var capability = format.read(doc).capability;

					Ext.each(capability.layers, function(obj) {
						records_Layer.push({
							name : obj.name,
							layer : obj
						})
					});

					layerStore = new Ext.data.ArrayStore({
						idIndex : 2,
						fields : layersRecord,
						data : records_Layer

					});
					modelCmp = corespondingCombo;
					modelCmp.setDisabled(false);
					if (modelCmp.store != null) {
						modelCmp.clearValue();
						modelCmp.store.removeAll();
						modelCmp.bindStore(layerStore);
					} else {
						modelCmp.store = layerStore;
					}
				},
				failure : function(r) {
					alert("Error getCapabilities");
				}
			});
		},

		/**
		 * get the layer name
		 * */
		getLayerName : function(layerComboValue) {
			layerName = layerComboValue.getValue().name;
			index = layerName.indexOf(":");
			if (index > 0) {
				layerName = layerName.substring(index + 1, layerName.length);
			}
			return layerName;
		},

		/**
		 * get the workspace
		 * */
		getWorkspace : function(layerComboValue, workspaceComboValue) {
			layerName = layerComboValue.getValue().name;
			index = layerName.indexOf(":");
			if (index > 0) {
				workspace = layerName.substring(0, index);
			} else {
				workspace = workspaceComboValue.getRawValue();
			}
			return workspace;
		},

		/**
		 * initializing the Proj4js global var
		 * */
		initProj4jsGlobalVar : function() {
			/*
			 * Setting of proj4js global vars.
			 */
			Proj4js.libPath = GEOR.config.PATHNAME + "/lib/proj4js/lib/";
			Ext.apply(Proj4js.defs, GEOR.custom.PROJ4JS_STRINGS);
		}

	}
})();
