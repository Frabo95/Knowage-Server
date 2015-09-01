Ext.define
(
	"Sbi.chart.designer.ChartConfigurationGauge",

	{
		extend : 'Ext.panel.Panel',
		id : "gaugePaneConfiguration",
		//columnWidth: 0.3,
		width : 245,
		title : LN("sbi.chartengine.configuration.gauge.panelTitle"),
		bodyPadding : 10,
		items : [],
		height : 100,

		fieldDefaults : {
			anchor : '100%'
		},

		layout : {
			type : 'vbox',
		//align: 'center'
		},

		constructor : function(config) {
			this.callParent(config);
			this.viewModel = config.viewModel;

			var item = 
			[				
				{
					xtype : 'numberfield',
					bind : '{configModel.startAnglePane}',
					fieldLabel : LN("sbi.chartengine.configuration.gauge.startAnglePane"),
					width : "200",
					//value : "0",
					maxValue : '360',
					minValue : '-270'
				},

				{
					xtype : 'numberfield',
					bind : '{configModel.endAnglePane}',
					fieldLabel : LN("sbi.chartengine.configuration.gauge.endAnglePane"),
					width : "200",
					//value : "90",
					maxValue : '360',
					minValue : '-270'
				}
			];

			this.add(item);
		}
	}
);