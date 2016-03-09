/* 
 *   @require Proj4js/proj4js.js 
 *   @require plugins/Tool.js
 *   @require GeoExt/widgets/Action.js
 *   @require OpenLayers/Control/DrawFeature.js
 *   @require OpenLayers/Control/DragFeature.js
 *   @require OpenLayers/Handler/Polygon.js
 *   @require OpenLayers/Handler/Path.js
 *   @require OpenLayers/Format/WPSExecute.js
 *   @require OpenLayers/WPSClient.js
 *   @require OpenLayers/WPSProcess.js
 *   @require OpenLayers/Format/WPSCapabilities.js
 *   @require OpenLayers/Control.js     
 **/

Ext.namespace("GEOR.Addons");

GEOR.Addons.Nearestfeature = Ext
		.extend(
				GEOR.Addons.Base,
				{

					map : this.map,


                                        win: null, 


					/**
					 * init the addon in the tools menu
					 */
					init : function(record) {

						GEOR.WPS_Utils.initProj4jsGlobalVar();

						var lang = OpenLayers.Lang.getCode();
						map = this.map;
						mapProjection = map.getProjection();
						counter = 0;
						this.defControl();
						clickNearest = new OpenLayers.Control.Click();
						map.addControl(clickNearest);

						wpsMenu = new Ext.menu.Menu(
								{
									items : [
											new Ext.Action(
													{
														id : "import",
														iconCls : "import",
														text : OpenLayers
																.i18n("nearestfeature.import"),
														allowDepress : false,
														tooltip : OpenLayers
																.i18n("nearestfeature.import.tooltip"),
														handler : this.showWindow
													}),

											new Ext.Action(
													{
														id : "clickNearest",
														iconCls : 'drawpoint',
														text : OpenLayers
																.i18n("nearestfeature.title"),
														map : map,
														toggleGroup : 'map',
														enableToggle : true,
														enableCheckChange : true,
														allowDepress : true,
														tooltip : OpenLayers
																.i18n("nearestfeature.tooltip"),
														handler : function() {
															clickNearest
																	.activate();
															Ext
																	.getCmp('clickNearest').checked = false;
														}

													}) ]
								});
						this.item = new Ext.menu.Item(
								{
									id : 'wps_nearestfeature',
									text : record.get("title")[lang]
											|| record.get("title")["en"],
									qtip : record.get("description")[lang]
											|| record.get("description")["en"],
									hidden : (this.options.showintoolmenu === true) ? false
											: true,
									menu : wpsMenu,
									iconCls : 'wps_nearestfeature'
								});

					},

					/**
					 * show configuration window
					 */
					showWindow : function() {

						if (!this.win) {

							serverStore_NF = GEOR.WPS_Utils.initServerStore();
							serverStore_NF.load();

							this.combo_Server_NF = GEOR.WPS_Utils
									.initCombobox(
											'combo_server_NF',
											serverStore,
											OpenLayers
													.i18n("nearestfeature.import.workspace"),
											'url', 'name', false);
							this.combo_Server_NF.on('select',
									function(combo, record) {
										GEOR.WPS_Utils.loadNextDataStore(Ext
												.getCmp('combo_server_NF'),
												record.get('url'),
												Ext.getCmp('combo_layer_NF'));
										Ext.getCmp('combo_layer_NF')
												.setDisabled(false);
									});
							this.combo_Layers_NF = GEOR.WPS_Utils
									.initCombobox(
											'combo_layer_NF',
											this.layerStore,
											OpenLayers
													.i18n("nearestfeature.import.layername"),
											'layer', 'name', true);

							this.win = new Ext.Window(
									{
										title : "Configuration",
										height : 150,
										width : 350,
										bodyStyle : 'padding: 5px',
										layout : 'form',
										labelWidth : 110,
										defaultType : 'field',
										items : [
												this.combo_Server_NF,
												this.combo_Layers_NF,
												{
													fieldLabel : OpenLayers
															.i18n("nearestfeature.import.projection"),
													width : 200,
													id : 'projection_NF',
													allowBlank : false
												} ],
										fbar : [
												'->',
												{
													text : OpenLayers
															.i18n("nearestfeature.import.submit"),
													id : 'submit_NF',
													formBind : true,

													handler : function() {

														workspace = GEOR.WPS_Utils
																.getWorkspace(
																		Ext
																				.getCmp('combo_layer_NF'),
																		Ext
																				.getCmp('combo_server_NF'));
														layerName = GEOR.WPS_Utils
																.getLayerName(Ext
																		.getCmp('combo_layer_NF'));

														concat = workspace
																+ ":"
																+ layerName;
														projection_NF = Ext
																.getCmp(
																		'projection_NF')
																.getValue();

														projection = "EPSG:"
																+ projection_NF;

														if (workspace == ""
																|| layerName == "") {
															Ext.Msg
																	.alert(
																			'Warning',
																			OpenLayers
																					.i18n("nearestfeature.warning.message"));
															return;
														}

														this.win.hide();

														var wms = new OpenLayers.Layer.WMS(
																layerName,
																GEOR.config.GEOSERVER_WMS_URL,
																{
																	layers : concat,
																	transparent : true
																},
																{
																	opacity : 0.5,
																	singleTile : true
																});

														map.addLayers([ wms ]);

													},

													scope : this
												} ],
										listeners : {
											"hide" : function() {
												// this.map.removeLayer(this.layer);
												// this.item &&
												// this.item.setChecked(false);
												// this.components &&
												// this.components.toggle(false);
												// alert("we are here");
											},
											scope : this
										}
									});

						}

						this.win.show();
					},

					/**
					 * * Method: defControl *
					 */
					defControl : function() {
						OpenLayers.Control.Click = OpenLayers
								.Class(
										OpenLayers.Control,
										{
											defaultHandlerOptions : {
												'single' : true,
												'double' : false,
												'pixelTolerance' : 0,
												'stopSingle' : false,
												'stopDouble' : false
											},
											initialize : function(options) {
												this.handlerOptions = OpenLayers.Util
														.extend(
																{},
																this.defaultHandlerOptions);
												OpenLayers.Control.prototype.initialize
														.apply(this, arguments);
												this.handler = new OpenLayers.Handler.Point(
														this,
														{
															'done' : this.clickevent
														});
											},
											clickevent : function(p) {

												if ((typeof (workspace) == 'undefined')
														|| (typeof (layerName) == 'undefined')) {
													Ext.Msg
															.alert(
																	'Warning',
																	OpenLayers
																			.i18n("nearestfeature.warning.message"));
													clickNearest.deactivate();
													return;
												}

												GEOR.waiter.show();
												var feat = new OpenLayers.Feature.Vector(
														p);
												var wpsFormat = new OpenLayers.Format.WPSExecute();
												var source = new Proj4js.Proj(
														mapProjection);
												var dest = new Proj4js.Proj(
														projection);
												p = Proj4js.transform(source,
														dest, p);
												// transform to wkt
												var wkt = new OpenLayers.Format.WKT();
												var feat2 = new OpenLayers.Feature.Vector(
														p);
												var pt = wkt.write(feat2);

												// desactivate the selection
												// point
												clickNearest.deactivate();
												var doc = wpsFormat
														.write({
															identifier : "gs:Nearest",
															dataInputs : [
																	{
																		identifier : "features",
																		reference : {
																			mimeType : 'text/xml',
																			href : 'http://geoserver/wfs',
																			method : 'POST',
																			body : {
																				wfs : {
																					version : '1.0.0',
																					url : GEOR.config.GEOSERVER_WFS_URL,
																					featurePrefix : workspace,
																					featureType : layerName,
																					geometryName : "the_geom",
																					srsName : projection,
																				}
																			}
																		}
																	},
																	{
																		identifier : "point",
																		data : {
																			complexData : {
																				attributes : {
																					mimeType : "application/wkt"
																				},
																				value : pt
																			}
																		}

																	},
																	{
																		identifier : "crs",
																		data : {
																			literalData : {
																				value : mapProjection
																			}
																		}
																	} ],
															responseForm : {
																rawDataOutput : {
																	mimeType : "text/xml",
																	identifier : "result"
																}

															}

														});

												OpenLayers.Request
														.POST({
															url : GEOR.custom.GEOSERVER_WPS_URL,
															data : doc,
															success : function(
																	response) {

																var features = new OpenLayers.Format.WFST.v1_0_0()
																		.read(response.responseText);
																var wfs = new OpenLayers.Layer.Vector(
																		"NearestFeature_"
																				+ counter,
																		{
																			projection : projection,
																			preFeatureInsert : function(
																					feature) {
																				feature.geometry
																						.transform(
																								projection,
																								map
																										.getProjection())
																			}

																		});

																if (features
																		&& (features instanceof OpenLayers.Feature.Vector || features.length)) {
																	wfs
																			.addFeatures(features);
																	counter = counter + 1;
																	this.map
																			.addLayers([ wfs ]);
																} else {
																	Ext.MessageBox
																			.show({
																				title : 'Warning',
																				msg : 'The wps process execution ended with problem',
																				buttons : Ext.MessageBox.OK
																			});
																}
																GEOR.waiter
																		.hide();
															},
															failure : function(
																	response) {
																alert(response.responseText);
																GEOR.waiter
																		.hide();
															}
														});
											},
											trigger : function(e) {
												var lonlat = map
														.getLonLatFromViewPortPx(e.xy);
												var feat = new OpenLayers.Feature.Vector(
														new OpenLayers.Geometry.Point(
																lonlat.lon,
																lonlat.lat));
												var gml = convertToGML([ feat ]);
												clickNearest.deactivate();
												this.executeWPS();
											}
										});
					},

					destroy : function() {
						GEOR.Addons.Base.prototype.destroy.call(this);

					}
				});
