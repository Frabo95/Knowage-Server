function renderWordCloud(chartConf){

	var maxic = 0;
	
	for (var i=0; i<chartConf.data[0].length; i++){
		
		if (chartConf.data[0][i].value > maxic){
			
			maxic = chartConf.data[0][i].value;
			
		}
		
	}
	
		(function() {

			function cloud() {
				var size = [256, 256],
				text = cloudText,
				font = cloudFont,
				fontSize = cloudFontSize,
				fontStyle = cloudFontNormal,
				fontWeight = cloudFontNormal,
				rotate = cloudRotate,
				padding = cloudPadding,
				spiral = archimedeanSpiral,
				words = [],
				timeInterval = Infinity,
				event = d3.dispatch("word", "end"),
				timer = null,
				cloud = {};

				cloud.start = function() {
					var board = zeroArray((size[0] >> 5) * size[1]),
					bounds = null,
					n = Math.min(words.length, chartConf.chart.maxWords),
					i = -1,
					tags = [],
					data = words.map(function(d, i) {
						d.text = text.call(this, d, i);
						d.font = font.call(this, d, i);
						d.style = fontStyle.call(this, d, i);
						d.weight = fontWeight.call(this, d, i);
						d.rotate = rotate.call(this, d, i);
						d.size = ~~fontSize.call(this, d, i);
						d.padding = padding.call(this, d, i);
						return d;
					}).sort(function(a, b) { return b.size - a.size; });

					if (timer) clearInterval(timer);
					timer = setInterval(step, 0);
					step();

					return cloud;

					function step() {
						var start = +new Date,
						d;
						while (+new Date - start < timeInterval && ++i < n && timer) {
							d = data[i];
							d.x = (size[0] * (Math.random() + .5)) >> 1;
							d.y = (size[1] * (Math.random() + .5)) >> 1;
							cloudSprite(d, data, i);
							if (d.hasText && place(board, d, bounds)) {
								tags.push(d);
								event.word(d);
								if (bounds) cloudBounds(bounds, d);
								else bounds = [{x: d.x + d.x0, y: d.y + d.y0}, {x: d.x + d.x1, y: d.y + d.y1}];
								// Temporary hack
								d.x -= size[0] >> 1;
								d.y -= size[1] >> 1;
							}
						}
						if (i >= n) {
							cloud.stop();
							event.end(tags, bounds);
						}
					}
				}

				cloud.stop = function() {
					if (timer) {
						clearInterval(timer);
						timer = null;
					}
					return cloud;
				};

				cloud.timeInterval = function(x) {
					if (!arguments.length) return timeInterval;
					timeInterval = x == null ? Infinity : x;
					return cloud;
				};

				function place(board, tag, bounds) {
					var perimeter = [{x: 0, y: 0}, {x: size[0], y: size[1]}],
					startX = tag.x,
					startY = tag.y,
					maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
					s = spiral(size),
					dt = Math.random() < .5 ? 1 : -1,
							t = -dt,
							dxdy,
							dx,
							dy;

					while (dxdy = s(t += dt)) {
						dx = ~~dxdy[0];
						dy = ~~dxdy[1];

						if (Math.min(dx, dy) > maxDelta) break;

						tag.x = startX + dx;
						tag.y = startY + dy;

						if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
								tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
						// TODO only check for collisions within current bounds.
						if (!bounds || !cloudCollide(tag, board, size[0])) {
							if (!bounds || collideRects(tag, bounds)) {
								var sprite = tag.sprite,
								w = tag.width >> 5,
								sw = size[0] >> 5,
								lx = tag.x - (w << 4),
								sx = lx & 0x7f,
								msx = 32 - sx,
								h = tag.y1 - tag.y0,
								x = (tag.y + tag.y0) * sw + (lx >> 5),
								last;
								for (var j = 0; j < h; j++) {
									last = 0;
									for (var i = 0; i <= w; i++) {
										board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
									}
									x += sw;
								}
								delete tag.sprite;
								return true;
							}
						}
					}
					return false;
				}

				cloud.words = function(x) {
					if (!arguments.length) return words;
					words = x;
					return cloud;
				};

				cloud.size = function(x) {
					if (!arguments.length) return size;
					size = [+x[0], +x[1]];
					return cloud;
				};

				cloud.font = function(x) {
					if (!arguments.length) return font;
					font = d3.functor(x);
					return cloud;
				};

				cloud.fontStyle = function(x) {
					if (!arguments.length) return fontStyle;
					fontStyle = d3.functor(x);
					return cloud;
				};

				cloud.fontWeight = function(x) {
					if (!arguments.length) return fontWeight;
					fontWeight = d3.functor(x);
					return cloud;
				};

				cloud.rotate = function(x) {
					if (!arguments.length) return rotate;
					rotate = d3.functor(x);
					return cloud;
					
				};

				cloud.text = function(x) {
					if (!arguments.length) return text;
					text = d3.functor(x);
					return cloud;
				};

				cloud.spiral = function(x) {
					if (!arguments.length) return spiral;
					spiral = spirals[x + ""] || x;
					return cloud;
				};

				cloud.fontSize = function(x) {
					if (!arguments.length) return fontSize;
					fontSize = d3.functor(x);
					return cloud;
				};

				cloud.padding = function(x) {
					if (!arguments.length) return padding;
					padding = d3.functor(x);
					return cloud;
				};

				return d3.rebind(cloud, event, "on");
			}

			function cloudText(d) {
				return d.text;
			}

			function cloudFont() {
				return "serif";
			}

			function cloudFontNormal() {
				return "normal";
			}

			function cloudFontSize(d) {
				return Math.sqrt(d.value);
			}

			function cloudRotate() {
				return (~~(Math.random() * 6) - 3) * 30;
			}

			function cloudPadding() {
				return 1;
			}

			// Fetches a monochrome sprite bitmap for the specified text.
			// Load in batches for speed.
			function cloudSprite(d, data, di) {
				if (d.sprite) return;
				c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
				var x = 0,
				y = 0,
				maxh = 0,
				n = data.length;
				--di;
				while (++di < n) {
					d = data[di];
					c.save();
					c.font = d.style + " " + d.weight + " " + ~~((d.size + 1) / ratio) + "px " + d.font;
					var w = c.measureText(d.text + "m").width * ratio,
					h = d.size << 1;
					
					if (d.rotate) 
					{
						var sr = Math.sin(d.rotate * cloudRadians),
						cr = Math.cos(d.rotate * cloudRadians),
						wcr = w * cr,
						wsr = w * sr,
						hcr = h * cr,
						hsr = h * sr;
						w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5;
						h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
					} 
					else 
					{
						w = (w + 0x1f) >> 5 << 5;
					}
					
					if (h > maxh) 
						maxh = h;
					if (x + w >= (cw << 5)) {
						x = 0;
						y += maxh;
						maxh = 0;
					}
					if (y + h >= ch) break;
					c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio);
					if (d.rotate) c.rotate(d.rotate * cloudRadians);
					c.fillText(d.text, 0, 0);
					if (d.padding) c.lineWidth = 2 * d.padding, c.strokeText(d.text, 0, 0);
					c.restore();
					d.width = w;
					d.height = h;
					d.xoff = x;
					d.yoff = y;
					d.x1 = w >> 1;
					d.y1 = h >> 1;
					d.x0 = -d.x1;
					d.y0 = -d.y1;
					d.hasText = true;
					x += w;
				}
				var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data,
				sprite = [];
				while (--di >= 0) {
					d = data[di];
					if (!d.hasText) continue;
					var w = d.width,
					w32 = w >> 5,
					h = d.y1 - d.y0;
					// Zero the buffer
					for (var i = 0; i < h * w32; i++) sprite[i] = 0;
					x = d.xoff;
					if (x == null) return;
					y = d.yoff;
					var seen = 0,
					seenRow = -1;
					for (var j = 0; j < h; j++) {
						for (var i = 0; i < w; i++) {
							var k = w32 * j + (i >> 5),
							m = pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 << (31 - (i % 32)) : 0;
							sprite[k] |= m;
							seen |= m;
						}
						if (seen) seenRow = j;
						else {
							d.y0++;
							h--;
							j--;
							y++;
						}
					}
					d.y1 = d.y0 + seenRow;
					d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
				}
			}

			// Use mask-based collision detection.
			function cloudCollide(tag, board, sw) {
				sw >>= 5;
				var sprite = tag.sprite,
				w = tag.width >> 5,
				lx = tag.x - (w << 4),
				sx = lx & 0x7f,
				msx = 32 - sx,
				h = tag.y1 - tag.y0,
				x = (tag.y + tag.y0) * sw + (lx >> 5),
				last;
				for (var j = 0; j < h; j++) {
					last = 0;
					for (var i = 0; i <= w; i++) {
						if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0))
								& board[x + i]) return true;
					}
					x += sw;
				}
				return false;
			}

			function cloudBounds(bounds, d) {
				var b0 = bounds[0],
				b1 = bounds[1];
				if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
				if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
				if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
				if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
			}

			function collideRects(a, b) {
				return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
			}

			function archimedeanSpiral(size) {
				var e = size[0] / size[1];
				return function(t) {
					return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
				};
			}

			function rectangularSpiral(size) {
				var dy = 4,
				dx = dy * size[0] / size[1],
				x = 0,
				y = 0;
				return function(t) {
					var sign = t < 0 ? -1 : 1;
					// See triangular numbers: T_n = n * (n + 1) / 2.
					switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
					case 0:  x += dx; break;
					case 1:  y += dy; break;
					case 2:  x -= dx; break;
					default: y -= dy; break;
					}
					return [x, y];
				};
			}

			// TODO reuse arrays?
			function zeroArray(n) {
				var a = [],
				i = -1;
				while (++i < n) a[i] = 0;
				return a;
			}

			var cloudRadians = Math.PI / 180,
			cw = 1 << 11 >> 5,
			ch = 1 << 11,
			canvas,
			ratio = 1;

			if (typeof document !== "undefined") {
				canvas = document.createElement("canvas");
				canvas.width = 1;
				canvas.height = 1;
				ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
				canvas.width = (cw << 5) / ratio;
				canvas.height = ch / ratio;
			} else {
				// Attempt to use node-canvas.
				canvas = new Canvas(cw << 5, ch);
			}

			var c = canvas.getContext("2d"),
			spirals = {
				archimedean: archimedeanSpiral,
				rectangular: rectangularSpiral
			};
			c.fillStyle = c.strokeStyle = "red";
			c.textAlign = "center";

			if (typeof module === "object" && module.exports) module.exports = cloud;
			else (d3.layout || (d3.layout = {})).cloud = cloud;
		})();

		var maxfontsize=chartConf.chart.maxFontSize;
		var fill = d3.scale.category20();

		d3.layout.cloud().size([chartConf.chart.width, chartConf.chart.height])
		.words(chartConf.data[0].map(function(d) {
			 return {text: d.name, size: d.value/(maxic/maxfontsize)};
		}))
		.padding(chartConf.chart.wordPadding)
		.rotate(function() {
			var angle = (Math.random() * 2) * 90;
			while ((angle < chartConf.chart.minAngle || angle > chartConf.chart.maxAngle)){
				angle = (Math.random() * 2) * 90;
			}
			return angle })
		.font("Impact")
		.fontSize(function(d) { return d.size; })
		.on("end", draw)
		.start();

		function draw(words) {
			
			d3.select("body")
			.append("div").attr("id","main")
			.style("font-family", chartConf.chart.style.fontFamily);
			
			if (chartConf.data[0].length < 1)
			{
				var emptyMsgFontSize = parseInt(chartConf.emptymessage.style.fontSize);
				var emptyMsgDivHeight = parseInt(chartConf.emptymessage.height);
				var emptyMsgTotal = emptyMsgDivHeight+emptyMsgFontSize/2;
				
				// Set title
				d3.select("#main").append("div")
					.style("height",emptyMsgTotal)
					.style("position",chartConf.emptymessage.position)
					.style("left",chartConf.emptymessage.paddingLeft)
					.style("color",chartConf.emptymessage.style.fontColor)
					.style("text-align",chartConf.emptymessage.style.textAlign)
		    		.style("font-family",chartConf.emptymessage.style.fontType)
		    		.style("font-style",chartConf.emptymessage.style.fontStyle ? chartConf.emptymessage.style.fontStyle : "none")
		    		.style("font-weight",chartConf.emptymessage.style.fontWeight ? chartConf.emptymessage.style.fontWeight : "none")
		    		.style("text-decoration",chartConf.emptymessage.style.textDecoration ? chartConf.emptymessage.style.textDecoration : "none")
		    		.style("font-size",emptyMsgFontSize)
					.text(chartConf.emptymessage.text);	
			}
			else
			{						
				// Set title
				d3.select("#main").append("div")
					.style("color",chartConf.title.style.color)
					.style("text-align",chartConf.title.style.align)
		    		.style("font-family",chartConf.title.style.fontFamily)
		    		.style("font-size",chartConf.title.style.fontSize)
		    		.style("font-style",chartConf.title.style.fontStyle ? chartConf.title.style.fontStyle : "none")
		    		.style("font-weight",chartConf.title.style.fontWeight ? chartConf.title.style.fontWeight : "none")
		    		.style("text-decoration",chartConf.title.style.textDecoration ? chartConf.title.style.textDecoration : "none")
					.text(chartConf.title.text);	
								
				// Set subtitle
				d3.select("#main").append("div")					
					.style("color",chartConf.subtitle.style.color)
					.style("text-align",chartConf.subtitle.style.align)
		    		.style("font-family",chartConf.subtitle.style.fontFamily)
		    		.style("font-style",chartConf.subtitle.style.fontStyle ? chartConf.subtitle.style.fontStyle : "none")
		    		.style("font-weight",chartConf.subtitle.style.fontWeight ? chartConf.subtitle.style.fontWeight : "none")
		    		.style("text-decoration",chartConf.subtitle.style.textDecoration ? chartConf.subtitle.style.textDecoration : "none")
		    		.style("font-size",chartConf.subtitle.style.fontSize)
					.text(chartConf.subtitle.text);
			      
			d3.select("body").append("svg")
			.attr("width", chartConf.chart.width)
			.attr("height", chartConf.chart.height)
			.append("g")
			.attr("transform", "translate("+(chartConf.chart.width/2-40)+","+(chartConf.chart.height/2-10)+")")
			.selectAll("text")
			.data(words)
			.enter().append("text")
			.style("font-size", function(d) { return d.size + "px"; })
			.style("font-family",chartConf.chart.style.fontFamily)
			.style("fill", function(d, i) { return fill(i); })
			.attr("text-anchor", "middle")
			.attr("transform", function(d) {
				return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
			})
			.text(function(d) { return d.text; });
			}	
		}
		
	}
	
	function renderSunburst(jsonObject)
	{
		/*The part that we need to place into HTML (JSP) in order to attach 
		 * given data to them - we are going to create it through D3 notation */
				
		/* Check if configurable (from the Designer point of view)
		 * parameters are defined through the Designer. If not set
		 * the predefined values, instead. */			
		
		var chartHeight = (jsonObject.chart.height != '$chart.height') ? parseInt(jsonObject.chart.height) : 400 ;
		var chartFontFamily = (jsonObject.chart.style.fontFamily != '$chart.style.fontFamily') ? jsonObject.chart.style.fontFamily : "Arial" ;
		var chartFontSize = (jsonObject.chart.style.fontSize != '$chart.style.fontSize') ? jsonObject.chart.style.fontSize : "9px" ;
		var chartFontWeight = (jsonObject.chart.style.fontWeight != '$chart.style.fontWeight') ? jsonObject.chart.style.fontWeight : "Normal" ;
		var chartBackgroundColor = (jsonObject.chart.style.backgroundColor != '$chart.style.backgroundColor') ? jsonObject.chart.style.backgroundColor : "#000000" ;
		var chartOpacityOnMouseOver = (jsonObject.chart.opacMouseOver != '$chart.style.opacMouseOver') ? parseInt(jsonObject.chart.opacMouseOver) : 50 ;
		
		/* Dimensions of the Sunburst chart. */
	    /* Dimensions of the window in which chart is going to be placed.
	     * Hence, radius of the circular Sunburst chart is going to be half of
	     * the lesser dimension of that window. */				
	    //var width = parseInt(jsonObject.chart.width);
	    var width = window.innerWidth;
		var height = chartHeight;
		
		/* Manage chart position on the screen (in the window) depending on
		 * the resizing of it, so the chart could be in the middle of it. */
		window.onresize = function() 
		{
		    width = document.getElementById("chart").getBoundingClientRect().width;
		    d3.select("#container").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
		};	
		
		var radius = Math.min(width,height)/2;	
		
		var chartOrientation = (width > height) ? "horizontal" : "vertical";
		
		// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
		var bcWidth = parseInt(jsonObject.toolbar.style.width);
		var bcHeight = parseInt(jsonObject.toolbar.style.height);
		var bcSpacing = parseInt(jsonObject.toolbar.style.spacing);
		var bcTail = parseInt(jsonObject.toolbar.style.tail);
		
		/* 'topPadding':	padding (empty space) between the breadcrumb 
		 * 					(toolbar) and the top of the chart when the
		 * 					toolbar is possitioned on the top of the chart. 
		 * 'bottomPadding':	padding (empty space) between the bottom of the 
		 * 					chart and the top of the breadcrumb (toolbar) 
		 * 					when the toolbar is possitioned on the top 
		 * 					of the chart. */
		var topPadding = 30;
		var bottomPadding = 30;
		
	    var tipFontSize = parseInt(jsonObject.tip.style.fontSize);
	    var tipWidth = parseInt(jsonObject.tip.style.width);
		
	    // Parameters (dimensions) for the toolbar (breadcrumb)
		var b = { 
					w: bcWidth, 	h: bcHeight, 
					s: bcSpacing, 	t: bcTail 
				};
//	    console.log(jsonObject);
		/* Create necessary part of the HTML DOM - the one that code need to
		 * position chart on the page (D3 notation) */
		d3.select("body")
			.append("div").attr("id","main")
			.style("font-family", chartFontFamily)
			.style("font-size", chartFontSize)
			.style("font-style",jsonObject.chart.style.fontStyle ? jsonObject.chart.style.fontStyle : "none")
    		.style("font-weight",jsonObject.chart.style.fontWeight ? jsonObject.chart.style.fontWeight : "none")
    		.style("text-decoration",jsonObject.chart.style.textDecoration ? jsonObject.chart.style.textDecoration : "none")
			.style("background-color",chartBackgroundColor);
		
		// If there is no data in the recieved JSON object - print empty message
		if (jsonObject.data[0].length < 1)
		{
			var emptyMsgFontSize = parseInt(jsonObject.emptymessage.style.fontSize);
			var emptyMsgTotal = emptyMsgDivHeight+emptyMsgFontSize/2;
			
			// Set empty text on the chart
			d3.select("#main").append("div")
				.style("color",jsonObject.emptymessage.style.color)
				.style("text-align",jsonObject.emptymessage.style.align)
	    		.style("font-family",jsonObject.emptymessage.style.fontFamily)
	    		.style("font-style",jsonObject.emptymessage.style.fontStyle ? jsonObject.emptymessage.style.fontStyle : "none")
	    		.style("font-weight",jsonObject.emptymessage.style.fontWeight ? jsonObject.emptymessage.style.fontWeight : "none")
	    		.style("text-decoration",jsonObject.emptymessage.style.textDecoration ? jsonObject.emptymessage.style.textDecoration : "none")
	    		.style("font-size",emptyMsgFontSize)
				.text(jsonObject.emptymessage.text);	
		}
		else
		{			
			// Set title on the chart
			d3.select("#main").append("div")
				.attr("id","title")  
				.style("color",jsonObject.title.style.color)
				.style("text-align",jsonObject.title.style.align)
	    		.style("font-family",jsonObject.title.style.fontFamily)
	    		.style("font-style",jsonObject.title.style.fontStyle ? jsonObject.title.style.fontStyle : "none")
	    		.style("font-weight",jsonObject.title.style.fontWeight ? jsonObject.title.style.fontWeight : "none")
	    		.style("text-decoration",jsonObject.title.style.textDecoration ? jsonObject.title.style.textDecoration : "none")
	    		.style("font-size",jsonObject.title.style.fontSize)
				.text(jsonObject.title.text);	
			
			// Set subtitle on the chart
			d3.select("#main").append("div")
				.attr("id","subtitle")  
				.style("color",jsonObject.subtitle.style.color)
				.style("text-align",jsonObject.subtitle.style.align)
	    		.style("font-family",jsonObject.subtitle.style.fontFamily)
	    		.style("font-style",jsonObject.subtitle.style.fontStyle ? jsonObject.subtitle.style.fontStyle : "none")
	    		.style("font-weight",jsonObject.subtitle.style.fontWeight ? jsonObject.subtitle.style.fontWeight : "none")
	    		.style("text-decoration",jsonObject.subtitle.style.textDecoration ? jsonObject.subtitle.style.textDecoration : "none")
	    		.style("font-size",jsonObject.subtitle.style.fontSize)
				.text(jsonObject.subtitle.text);
		    
			/* Put the topPadding on the the top of the chart, even if toolbar
			 * is set on the bottom of the chart (because of the clearer and 
			 * more structured view). */
		    d3.select("#main").append("div").style("height",topPadding);
		    
		    /* Get the data about the height of the title, subtitle and toolbar 
		     * already placed on the chart. */
		    var titleHeight = d3.select("#title")[0][0].getBoundingClientRect().height;
		    var subtitleHeight = d3.select("#subtitle")[0][0].getBoundingClientRect().height;
		    var breadCrumbHeight = parseInt(jsonObject.toolbar.style.height);
		    
		    /* Sum of heights of all of the DOM elements above the chart's center:
		     * title, subtitle, toolbar (breadcrumb), padding between the toolbar 
		     * and the chart, half of the height of the chart. */
		    var sumOfHeightsAboveChartCenter = parseInt(titleHeight + subtitleHeight + height/2 + topPadding);		    	
		    
		    if (jsonObject.toolbar.style.position=="top")
			{   
		    	sumOfHeightsAboveChartCenter = parseInt(sumOfHeightsAboveChartCenter + breadCrumbHeight);		    	
	    		d3.select("#main").append("div").attr("id","sequence");	
			}
		    
		    d3.select("#main").append("div").attr("id","chart");	        
	    	
	    	if (jsonObject.toolbar.style.position=="bottom")
			{   
		    	/* Add padding between the bottom of the chart and the top of 
		    	 * the toolbar (breadcrumb). */	  
	    		d3.select("#main").append("div").style("height",bottomPadding);
		    	d3.select("#main").append("div").attr("id","sequence");				
			}
	    	
	    	if (jsonObject.toolbar.style.position=="top")
			{   
	    		d3.select("#main").append("div").style("height",bottomPadding);
			}
		       
		}
		
		/* Collect all possible colors into one array - PREDEFINED set of colors
		 * (the ones that we are going to use in case configuration for the
		 * current user (customized) is not set already) */	
		var children = new Array();	
		
		children = children.concat(d3.scale.category10().range());
		children = children.concat(d3.scale.category20().range());
		children = children.concat(d3.scale.category20b().range());
		children = children.concat(d3.scale.category20c().range());
		
		/* Map that will contain key-value pairs. Key is going to be name of each 
		 * individual element of the result (of the request for dataset). Value 
		 * will be the color that is going to be assigned to each element. */
		var colors = {}; 
		
		var colorArrangement = new Array();
		
		// Total size of all segments; we set this later, after loading the data.
		var totalSize = 0; 
		
		/* Put inside first "div" element the Suburst chart, i.e. SVG DOM
		 * element that will represent it. SVG window will be with previously
		 * defined dimensions ("width" and "height"). */		
		var vis = d3.select("#chart").append("svg:svg")
		    .attr("width", width)
		    .attr("height", height)
		    .append("svg:g")
		    .attr("id", "container")
		    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");	
		
		var partition = d3.layout.partition()
		    .size([2 * Math.PI, radius * radius])
		    .value(function(d) { return d.size; });
		
		/* Counting angular data for some particular element of dataset. */
		var arc = d3.svg.arc()
		    .startAngle(function(d) { return d.x; })
		    .endAngle(function(d) { return d.x + d.dx; })
		    .innerRadius(function(d) { return Math.sqrt(d.y); })
		    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
		 
		/* Get hierarchy of root data (first level of the chart) - 
		 * data ordered by their presence in total ammount (100% of the sum). 
		 * E.g. if we have this distribution of data for particular query:
		 * USA: 78%, Canada: 12%, Mexico: 8%, No country: 2%, the "children"
		 * array (sequence) inside "json" variable will be in descending order: 
		 * USA, Canada, Mexico, No country. */
		var json = buildHierarchy(jsonObject.data[0]);
		
		createVisualization(json);
		
		  function getGradientColorsHSL(args) {
		     var  baseColor = args[0];
		     var  from =args[1];
		     var  to =args[2];
		     var  number =args[3];
		        var hsl = baseColor,
		            fromH = 'h' in from ? from.h : hsl[0],
		            fromS = 's' in from ? from.s : hsl[1],
		            fromL = 'l' in from ? from.l : hsl[2],
		            toH = 'h' in to ? to.h : hsl[0],
		            toS = 's' in to ? to.s : hsl[1],
		            toL = 'l' in to ? to.l : hsl[2],
		            i, colors = [],
		            deltaH = (toH - fromH) / number,
		            deltaS = (toS - fromS) / number,
		            deltaL = (toL - fromL) / number;
		        for (i = 0; i <= number; i++) {
		            colors.push(Ext.draw.Color.fromHSL(
		                fromH + deltaH * i,
		                fromS + deltaS * i,
		                fromL + deltaL * i
		            ).toString());
		        }
		        return colors;
		    }
		
		// Main function to draw and set up the visualization, once we have the data.
		function createVisualization(json) 
		{	
			// Basic setup of page elements.
			/* Set the initial configuration of the breadcrumb - 
			 * defining dimensions of the trail, color of the text 
			 * and position of it within the chart (top (default), bottom) */	
			initializeBreadcrumbTrail();
			
			// Bounding circle underneath the sunburst, to make it easier to detect
			// when the mouse leaves the parent g.
			vis.append("svg:circle")
				.attr("r", radius)
				.style("opacity", 0);

			// For efficiency, filter nodes to keep only those large enough to see.
			var nodes = partition.nodes(json).filter
			(
				function(d) 
				{
					return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
				}
			);
			
			// NEW
			
			/* Dark colors for the chart's first layer items */
			var storeFirstLayerColor = 
			[
			 	"#CC0000", 	// red
			 	"#003D00", 	// green
			 	"#151B54", 	// blue	
			 	"#CC3399",	// purple
			 	"#808080",	// gray
			 	"#FF9900"	// orange			 			 	
		 	];
			
			var storeColors = 
			[
			 	"red", "green", "blue"
			 ];
			
			var varietiesOfMainColors = 
			{
				red: 	["#CC0000", "#FF4747", "#FF7A7A", "#FF9595", "#FFAAAA", "#FFBBBB", "#FFC9C9", "#FFD4D4", "#FFDDDD", "#FFE4E4", "#FFECEC"],
				green: 	["#003D00", "#003100", "#194619", "#305830", "#456945", "#587858", "#698669", "#789278", "#869D86", "#92A792", "#9DB09D"],
				blue: 	["#151B54", "#2C3265", "#414674", "#545882", "#65698E", "#747899", "#8286A3", "#8E92AC", "#999DB4", "#A3A7BC", "#BDC0CF"]
			};
			
			var rbgRedColor = d3.rgb("#CC0000");
			var rgbRedWhiteColor = d3.rgb("#FFECEC");
			
			var hslRedColor = rbgRedColor.hsl();
			var hslRedWhiteColor = rgbRedWhiteColor.hsl();
			
			var gradientColors = getGradientColorsHSL([hslRedColor,hslRedColor,hslRedWhiteColor,10]);
//			console.log(gradientColors);
			
			var  baseColor = Ext.draw.Color.create(args[0]);
		     var  from =args[1];
		     var  to =args[2];
		     var  number =args[3];
			
			var firstLayerPairs = {};
			var aaaa = aaa(nodes);
			var iii = 0;
			
			var counter = 0;
			
			var path = vis.data([json]).selectAll("path")
				.data(nodes)
				.enter().append("svg:path")
				.attr("display", function(d) { return d.depth ? null : "none"; })
				.attr("d", arc)
				.attr("fill-rule", "evenodd")
				.style
				(
						"fill", 
						
						function(d,i) 
						{   	    								
							  /* Go through the array of key-value pairs (elements of the chart and their color)
							   * and check if there is unique element-color mapping. */
//							  if (colors[d.name] == undefined && d.name != "root")
//							  {
//								  var numberOfColor = Math.floor(Math.random()*children.length);
//								  colors[d.name] = children[numberOfColor];								  
//							  }
							  
							  // NEW ***
							  
							  /* If current node is not a root */
							  if (d.name != "root")
							  {								  
								  /* If current node's parent name is root
								   * (if this node is part of the first layer) */
								  					  
								  if (d.parent.name=="root")
								  {
									  colors[d.name] = varietiesOfMainColors[storeColors[iii]][0];									 
									  iii++;
								  }		
								  else
								  {
//									  console.log(d);
//									  console.log(d.layer);
//									  console.log(varietiesOfMainColors);
//									  
//									  console.log(aaaa);									  
//									  console.log(aaaa.indexOf(d.firstLayerParent));
//									  
//									  
//									  //console.log(rrr);
//									  console.log(storeColors);
									  colors[d.name] = varietiesOfMainColors[storeColors[aaaa.indexOf(d.firstLayerParent)]][d.layer+1];
								  }
								  
								  d['color'] = colors[d.name];
							  }		
							  
//							  console.log(colors);
//							  console.log(colors[d.name]);
							  colorArrangement[i] = colors[d.name];
							  return colors[d.name];	  
						}
				)					
				.style("opacity", 1)
				.on("mouseover", mouseover);

				drawLegend();
			
				// Add the mouseleave handler to the bounding circle.
				d3.select("#container").on("mouseleave", mouseleave);

				// Get total size of the tree = value of root node from partition.
				totalSize = path.node().__data__.value;
		 };
		
		 function aaa(nodes)
		 {			 
			 /* Dark colors for the chart's first layer items */
				var storeFirstLayerColor = 
				[
				 	"#CC0000", 	// red
				 	"#003D00", 	// green
				 	"#151B54", 	// blue	
				 	"#CC3399",	// purple
				 	"#808080",	// gray
				 	"#FF9900"	// orange			 			 	
			 	];
			 
				var arrayOfParents = [];
				
			 for (var i=0; i<nodes.length; i++)
			 {
				 if (nodes[i].parent && nodes[i].parent.name=="root")
				 {
					 arrayOfParents.push(nodes[i].name);
				 }
			 }
			 
//			 console.log(arrayOfParents);
			 
			 return arrayOfParents;
		 };
		 
		// Fade all but the current sequence, and show it in the breadcrumb trail.
		function mouseover(d) 
		{	
		  var percentage = (100 * d.value / totalSize).toPrecision(3);
		  var percentageString = percentage + "%";
		  
		  if (percentage < 0.1) 
		  {
		    percentageString = "< 0.1%";
		  }
		  
		  /* If we already have move mouse over the chart, remove
		   * previous content for the "explanation", i.e. move the
		   * previous text inside the chart.  */
		  if (d3.select("#explanation")[0][0] != null)
		  {
			  d3.select("#explanation").remove();
			  d3.select("#percentage").remove();
		  }	  
		  
		  d3.select("#chart")   	
	    	.append("div").attr("id","explanation")
	    	.append("span").attr("id","percentage");
		  
		  d3.select("#explanation")
		  	.append("text").html("</br>" + jsonObject.tip.text)
	    	.style("text-align","center")
	    	.style("font-family",jsonObject.tip.style.fontFamily)
	  		.style("font-style",jsonObject.tip.style.fontStyle ? jsonObject.tip.style.fontStyle : "none")
    		.style("font-weight",jsonObject.tip.style.fontWeight ? jsonObject.tip.style.fontWeight : "none")
    		.style("text-decoration",jsonObject.tip.style.textDecoration ? jsonObject.tip.style.textDecoration : "none")
	  		.style("font-size",tipFontSize); 
		
		  d3.select("#percentage")
		  	.text(percentageString)		  	
		      .style("font-family",jsonObject.tip.style.fontFamily)
	    		.style("font-style",jsonObject.tip.style.fontStyle ? jsonObject.tip.style.fontStyle : "none")
	    		.style("font-weight",jsonObject.tip.style.fontWeight ? jsonObject.tip.style.fontWeight : "none")
	    		.style("text-decoration",jsonObject.tip.style.textDecoration ? jsonObject.tip.style.textDecoration : "none")
	    		.style("font-size",tipFontSize)
	    		.style("vertical-align","middle");		  
	    			
		  var percentageHeight = document.getElementById('percentage').getBoundingClientRect().height;
		  var explanationHeight = document.getElementById('explanation').getBoundingClientRect().height;	
		  		    
		  d3.select("#explanation")
		  	.style("color",jsonObject.tip.style.color)
			.style("position","absolute")
			.style("left",width/2-tipWidth/2)
			.style("width",tipWidth)
			.style("text-align","center");
		    		
		  /* When width of the text area (rectangle) is set, count 
		   * the height of the invisible text rectangle in which 
		   * text will fit. */
		  var textRectangleHight = d3.select("#explanation")[0][0].clientHeight;		  
		  var distanceFromTheTop = sumOfHeightsAboveChartCenter - textRectangleHight/2;
		    
		  /* When text area in the middle of the chart is determined,
		   * set the distance of the invisible text rectangle from
		   * the top of the window to the top of that rectangle.*/
		  d3.select("#explanation")
    		.style("top",distanceFromTheTop);    				    
		    
		  d3.select("#explanation")
		      .style("visibility", "");
		
		  var sequenceArray = getAncestors(d);
		  updateBreadcrumbs(sequenceArray, percentageString);
		  
		  var opacMouseOver = chartOpacityOnMouseOver;
		  opacMouseOver = opacMouseOver/100; // normalize value from interval [1,100] to %
		  
		  d3.selectAll("path")
	      	.style("opacity", opacMouseOver);
		
		  // Then highlight only those that are an ancestor of the current segment.
		  vis.selectAll("path")
		      .filter(function(node) {
		                return (sequenceArray.indexOf(node) >= 0);
		              })
		      .style("opacity", 1);
		}
		
		// Restore everything to full opacity when moving off the visualization.
		function mouseleave(d) {
		
		  // Hide the breadcrumb trail
		  d3.select("#trail")
		      .style("visibility", "hidden");
		
		  // Deactivate all segments during transition.
		  d3.selectAll("path").on("mouseover", null);
		
		  // Transition each segment to full opacity and then reactivate it.
		  d3.selectAll("path")
		      .transition()
		      .duration(1000)
		      .style("opacity", 1)
		      .each("end", function() {
		              d3.select(this).on("mouseover", mouseover);
		            });
		
		  d3.select("#explanation")
		      .style("visibility", "hidden");
		}
		
		// Given a node in a partition layout, return an array of all of its ancestor
		// nodes, highest first, but excluding the root.
		function getAncestors(node) {
		  var path = [];
		  var current = node;
		  while (current.parent) {
		    path.unshift(current);
		    current = current.parent;
		  }
		  return path;
		}
		
		/* Put the breadcrumb trail that will
		 * be positioned at the position where DOM element with given
		 * ID (#sequence) resides. */
		function initializeBreadcrumbTrail() 
		{
			// Add the svg area.
			/* Adds the new SVG DOM element to the current structure -
			 * it appends new SVG to the very first "div" element in order
			 * to present breadcrumb. It specifies its dimensions (width,
			 * height */		
			
			var trail = d3.select("#sequence")
				.append("svg:svg")
				.attr("width", width)
				.attr("height", bcHeight)
				.attr("id", "trail");
			  
			// Add the label at the end, for the percentage.
			/* Append to the newly created SVG element text subelement 
			 * that will contain value of the percentage that covered sequence
			 * represent. Here, predefined color of percentage text is black
			 * (#000). ("#000") = ("black") */
			trail
				.append("svg:text")
				.attr("id", "endlabel")
				.style("fill", jsonObject.toolbar.style.percFontColor)
				.style("font-family", jsonObject.toolbar.style.fontFamily)
				.style("font-style",jsonObject.toolbar.style.fontStyle ? jsonObject.toolbar.style.fontStyle : "none")
	    		.style("font-weight",jsonObject.toolbar.style.fontWeight ? jsonObject.toolbar.style.fontWeight : "none")
	    		.style("text-decoration",jsonObject.toolbar.style.textDecoration ? jsonObject.toolbar.style.textDecoration : "none")
				.style("font-size", jsonObject.toolbar.style.fontSize);
		}
		
		// Generate a string that describes the points of a breadcrumb polygon.
		function breadcrumbPoints(d, i) {
		  var points = [];
		  points.push("0,0");
		  points.push(b.w + ",0");
		  points.push(b.w + b.t + "," + (b.h / 2));
		  points.push(b.w + "," + b.h);
		  points.push("0," + b.h);
		  if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
		    points.push(b.t + "," + (b.h / 2));
		  }
		  return points.join(" ");
		}
		
		// Update the breadcrumb trail to show the current sequence and percentage.
		function updateBreadcrumbs(nodeArray, percentageString) {
		
		  // Data join; key function combines name and depth (= position in sequence).
		  var g = d3.select("#trail")
		      .selectAll("g")
		      .data(nodeArray, function(d) { return d.name + d.depth; });
		
		  // Add breadcrumb and label for entering nodes.
		  var entering = g.enter().append("svg:g");
		
		  /* TODO: see how could possible be realized that breadcrumb items
		   * get different color for different levels, even if the same name. */
		  entering.append("svg:polygon")
		      .attr("points", breadcrumbPoints)
		      .style("fill", function(d) { return d.color; });
		  
		  entering.append("svg:text")
		      .attr("x", (b.w + b.t) / 2)
		      .attr("y", b.h / 2)
		      .attr("dy", "0.35em")
		      .attr("text-anchor", "middle")
		      .style("font-family",jsonObject.toolbar.style.fontFamily)
		      .style("font-size",jsonObject.toolbar.style.fontSize)
		      .style("font-style",jsonObject.toolbar.style.fontStyle ? jsonObject.toolbar.style.fontStyle : "none")
		      .style("font-weight",jsonObject.toolbar.style.fontWeight ? jsonObject.toolbar.style.fontWeight : "none")
		      .style("text-decoration",jsonObject.toolbar.style.textDecoration ? jsonObject.toolbar.style.textDecoration : "none")
		      .style("text-shadow", "0px 0px 10px #FFFFFF")
		      .text(function(d) { return d.name; });
		
		  // Set position for entering and updating nodes.
		  g.attr("transform", function(d, i) {
		    return "translate(" + i * (b.w + b.s) + ", 0)";
		  });
		
		  // Remove exiting nodes.
		  g.exit().remove();
		  
		  // Now move and update the percentage at the end.
		  d3.select("#trail").select("#endlabel")
		      .attr("x", (nodeArray.length + 0.5) * (b.w + b.s))
		      .attr("y", b.h / 2)
		      .attr("dy", "0.35em")
		      .attr("text-anchor", "middle")
		      .text(percentageString);
		
		  // Make the breadcrumb trail visible, if it's hidden.
		  d3.select("#trail")
		      .style("visibility", "");
		
		}
		
		function drawLegend() 
		{	
			// Dimensions of legend item: width, height, spacing, radius of rounded rect.
//			var li = 
//					{ 
//						w: parseInt(jsonObject.legend.style.width), h: parseInt(jsonObject.legend.style.height), 
//						s: parseInt(jsonObject.legend.style.spacing), r: parseInt(jsonObject.legend.style.radius) 
//					};
			
			var li = 
			{ 
				w: 200, h: 50, 
				s: 10, r: 15 
			};

			var numOfColorElems = Object.keys(colors).length;
			
			var legend = d3.select("#legend").append("svg:svg")
			.attr("width", li.w)
			.attr("height", numOfColorElems * (li.h + li.s));
					
			var g = legend.selectAll("g")
				.data(d3.entries(colors))
				.enter().append("svg:g")
				.attr
				(	
						"transform", 
						
						function(d, i) 
						{
							return "translate(0," + i * (li.h + li.s) + ")";
						}
				);

			g.append("svg:rect")
			.attr("rx", li.r)
			.attr("ry", li.r)
			.attr("width", li.w)
			.attr("height", li.h)
			.style("fill", function(d) { return d.value; });

			g.append("svg:text")
			.attr("x", li.w / 2)
			.attr("y", li.h / 2)
			.attr("dy", "0.35em")
			.attr("text-anchor", "middle")
			.text(function(d) { return d.key; });
		}
		
		/* ME: This function will be called whenever we click on "Legend" 
		 * checkbox (whether its already checked or it is not). It toggles
		 * legends visibility. */
		function toggleLegend() 
		{		
			var legend = d3.select("#legend");
			
			if (legend.style("visibility") == "hidden") 
			{
				legend.style("visibility", "");
			} 
			else 
			{
				legend.style("visibility", "hidden");
			}
		}
		
		// Take a 2-column CSV and transform it into a hierarchical structure suitable
		// for a partition layout. The first column is a sequence of step names, from
		// root to leaf, separated by hyphens. The second column is a count of how 
		// often that sequence occurred.
		function buildHierarchy(jsonObject) 
		{
		  var root = { "name": "root", "children": [] };
		  
		  /* Total number of data received when requesting dataset. */
		  var dataLength = jsonObject.length;
		  
		  var counter = 0;
		  for (var i = 0; i < dataLength; i++) 
		  {
		    //var sequence = jsonObject[i].column_1;
		   // var size =+ jsonObject[i].column_2;
			  //console.log(i);
			  var sequence = jsonObject[i].sequence;
			  var size =+ jsonObject[i].value;
			  		
		    if (isNaN(size)) 
		    { 
		    	// e.g. if this is a header row
		    	continue;
		    }
		    
		    /* ME: Split single parts within received data in order
		     * to create visualization of levels that represent those
		     * data. */
		    var parts = sequence.split("_SEP_");
		    
		    var currentNode = root;		    
		    
		    for (var j = 0; j < parts.length; j++) 
		    {
		    	currentNode["layer"] = j-1;
	    		currentNode["firstLayerParent"] = parts[0];	    
	    		
		    	var children = currentNode["children"];
		    	var nodeName = parts[j];
		    	var childNode;
		    	
		    	if (j + 1 < parts.length) 
		    	{
		    		// Not yet at the end of the sequence; move down the tree.
		    		var foundChild = false;
		    		
		    		for (var k = 0; k < children.length; k++) 
		    		{				    			
		    			if (children[k]["name"] == nodeName) 
		    			{
		    				childNode = children[k];
		    				foundChild = true;
		    				break;
	    				}
	    			}
		    		
		    		// If we don't already have a child node for this branch, create it.
		    		if (!foundChild) 
		    		{		    			
		    			childNode = {"name": nodeName, "children": []};		    	
		    			children.push(childNode);
		    		}
	    		
		    		currentNode = childNode;
		    		
		    		currentNode["firstLayerParent"] = parts[0];
		    		currentNode["layer"] = j-1;
		    	} 
		    	
		    	else 
		    	{
				 	// Reached the end of the sequence; create a leaf node.
				 	childNode = {"name": nodeName, "size": size};
				 	childNode["layer"] = j;
				 	childNode["firstLayerParent"] = parts[0];
				 	children.push(childNode);
		    	}	    		
		    
		    } 	// inner for loop
		    
		  }		// outter for loop
		  
		  return root;
		  
		};
	}	
	
	function renderParallelChart(data){
				
	var records = data.data[0];

	if(records.length>0){

		if (records.length>data.limit.maxNumberOfLines){

			var limitcolumn = data.limit.serieFilterColumn;

			records.sort(function(obj1, obj2) {
				return obj1[limitcolumn] - obj2[limitcolumn];
			});
		
		
		var len = records.length;
		
		var max = data.limit.maxNumberOfLines;
		
		if (data.limit.orderTopMinBottomMax === 'top'){
			
			var slicedData = records.slice(len-max,len);
			
			records = slicedData;
		}
		else if (data.limit.orderTopMinBottomMax === 'bottom'){
			
			var slicedData = records.slice(0,max);
			
			records = slicedData;
		}}

		var groupcolumn = data.chart.group;

		var group = Ext.decode(data.chart.groups);
		var column = Ext.decode(data.chart.serie);

		var groups = [];

		var columns = [];

		for (var i = 0; i< group.length; i++){

			groups.push(group[i][i]);
		}

		for (var i = 0; i<column.length;i++){

			columns.push(column[i][i]);
		}

		function pickColors(colors, n){ // picks n different colors from colors
			var selected=[];
			while(selected.length < n){   
				var c= colors[Math.floor(Math.random()*colors.length)];
				if(selected.indexOf(c)==-1){
					selected.push(c);
				}

			}
			return selected;
		}

		var allTableData;

        var colors = [];

		var colorsResponse = data.chart.colors;
	
	 var colorsResponseDec = Ext.decode(colorsResponse);
     
     for (var i = 0; i< colorsResponseDec.length; i++){

			colors.push(colorsResponseDec[i][i]);
		
		}

	var myColors=d3.scale.ordinal().domain(groups).range(colors);

	    var brushWidth = data.axis.brushWidth;

		var brushx = -Number(brushWidth)/2;

       var m = [40, 40, 40, 100],
		w = data.chart.width - m[1] - m[3],
		h = data.chart.height - m[0] - m[2];

		var x = d3.scale.ordinal().domain(columns).rangePoints([0, w]),
		y = {};

		var line = d3.svg.line(),
		axis = d3.svg.axis().orient("left"),
		foreground;

//		var titleFontSize = parseInt(data.title.style.fontSize);
//		var titleDivHeight = parseInt(data.title.height);
//		var titleTotal = titleDivHeight+titleFontSize/2;

		// Set title
		d3.select("body").append("div")
		.style("color",data.title.style.color)
		.style("text-align",data.title.style.align)
		.style("font-family",data.title.style.fontFamily)
		.style("font-style",data.title.style.fontStyle ? data.title.style.fontStyle : "none")
		.style("font-weight",data.title.style.fontWeight ? data.title.style.fontWeight : "none")
		.style("text-decoration",data.title.style.textDecoration ? data.title.style.textDecoration : "none")
		.style("font-size",data.title.style.fontSize)
		.text(data.title.text);

//		var subtitleFontSize = parseInt(data.subtitle.style.fontSize);
//		var subtitleDivHeight = parseInt(data.subtitle.height);
//		var subtitleTotal = subtitleDivHeight+subtitleFontSize/2;

		// Set subtitle
		d3.select("body").append("div")
		.style("color",data.subtitle.style.color)
		.style("text-align",data.subtitle.style.align)
		.style("font-family",data.subtitle.style.fontFamily)
		.style("font-style",data.subtitle.style.fontStyle ? data.subtitle.style.fontStyle : "none")
		.style("font-weight",data.subtitle.style.fontWeight ? data.subtitle.style.fontWeight : "none")
		.style("text-decoration",data.subtitle.style.textDecoration ? data.subtitle.style.textDecoration : "none")
		.style("font-size",data.subtitle.style.fontSize)
		.text(data.subtitle.text);

		var groupsHeight=groups.length*20+60;
		var svgHeight;
		if(groupsHeight > (h + m[0] + m[2])){
			svgHeight=groupsHeight;
		}else{
			svgHeight=h + m[0] + m[2];
		}
		
		d3.select("body").append("div").attr("id","chart").style("width",w + m[1] + m[3]+300)
		
		var svg = d3.select("#chart")
		.append("div")
		.style("float","left")
		.style("width",w + m[1] + m[3])
		.style("height", h + m[0] + m[2])
		.append("svg:svg")
		.style("font-size",18)
		.attr("width", w + m[1] + m[3])
		.attr("height", h + m[0] + m[2])
		.append("svg:g")
		.attr("transform", "translate(" + m[3] + "," + m[0] + ")");

		columns.forEach(function(d){
			records.forEach(function(p) {p[d] = +p[d]; });

			y[d] = d3.scale.linear()
			.domain(d3.extent(records, function(p) {return p[d]; }))
			.range([h, 0]);

			y[d].brush = d3.svg.brush()
			.y(y[d])
			.on("brush", brush);

		});

		var legend=d3.select("#chart").append("div")
		         .style("float","right")
		         .style("width",300)
		         .style("height",h + m[0] + m[2]+150)
		         .style("overflow","auto")
		         .append("svg:svg")
		         .style("font-size",10)
		         .attr("height", svgHeight)
		         .append("svg:g")
		         .attr("transform", "translate("+0 + "," + m[0] + ")");
		
		legend.append("svg:g")
		.attr("transform",  "translate("+ (30) +"," + 0 + ")" )
		.style("height",30)
		.append("svg:text").style("font-family",data.legend.title.style.fontFamily)
		.style("font-size",data.legend.title.style.fontSize)
		.style("font-style",data.legend.title.style.fontStyle ? data.legend.title.style.fontStyle : "none")
		.style("font-weight",data.legend.title.style.fontWeight ? data.legend.title.style.fontWeight : "none")
		.style("text-decoration",data.legend.title.style.textDecoration ? data.legend.title.style.textDecoration : "none")
		.attr("x", 20)
		.attr("y",-10)
		.attr("dy", ".31em")
		.text(groupcolumn);


		 legend.selectAll("g.legend")
		.data(groups)
		.enter().append("svg:g")
		.attr("class", "legend")
		.attr("transform", function(d, i) {
			return "translate("+ 20 +"," + (i* 20 + 20) + ")"; 
			});

		legend.selectAll("g.legend").append("svg:rect")
		//.attr("class", String)
		.style({"stroke":function(d) { return myColors(d); }, "stroke-width":"3px", "fill": function(d) { return myColors(d); }})
		.attr("x", 0)
		.attr("y", -6)
		.attr("width", 10)
		.attr("height", 10);

		legend.selectAll("g.legend").append("svg:text")
		.style("font-family",data.legend.element.style.fontFamily)
		.style("font-size",data.legend.element.style.fontSize)
		.style("font-style",data.legend.element.style.fontStyle ? data.legend.element.style.fontStyle : "none")
		.style("font-weight",data.legend.element.style.fontWeight ? data.legend.element.style.fontWeight : "none")
		.style("text-decoration",data.legend.element.style.textDecoration ? data.legend.element.style.textDecoration : "none")
		.attr("x", 20)
		.attr("dy", ".31em")
		.text(function(d) {	
			return d; });

		//tooltip
		var tooltip=d3.select("body")
		.append("div")
		.attr("class","tooltip")
		.style("opacity","0");

		d3.selectAll(".tooltip")
		.style("position","absolute")
		.style("text-align","center")
		.style("min-width",data.tooltip.minWidth+"px")
		.style("max-width",data.tooltip.maxWidth+"px")
		.style("min-height",data.tooltip.minHeight+"px")
		.style("max-height",data.tooltip.maxHeight+"px")
		.style("padding",data.tooltip.padding+"px")
		.style("font-size",data.tooltip.fontSize+"px")
		.style("font-family",data.tooltip.fontFamily)
		.style("border",data.tooltip.border+"px")
		.style("border-radius",data.tooltip.borderRadius+"px")
		.style("pointer-events","none");
		
		foreground = svg.append("svg:g")
		.attr("class","foreground")
		.style({"fill": "none", "stroke-opacity": ".5","stroke-width": "2px"})
		.selectAll("path")
		.data(records)
		.enter().append("svg:path")
		.attr("visible","true")
		.attr("d", path)
		.style("stroke", function(d) {return myColors(d[groupcolumn])});

		if (records.length<=20){

			foreground.on("mouseover",function(d){
				
				if(allTableData){

					for (var i=0; i<allTableData.length; i++){
						if(d[data.chart.tooltip] === allTableData[i][data.chart.tooltip]){

				tooltip.transition().duration(50).style("opacity","1");
				tooltip.style("background",myColors(d[groupcolumn]));
				tooltip.text(d[data.chart.tooltip])
				.style("left", (d3.event.pageX) + "px")     
				.style("top", (d3.event.pageY - 25) + "px");

						}

					}

				}
				else{

					tooltip.transition().duration(50).style("opacity","1");
					tooltip.style("background",myColors(d[groupcolumn]));
					tooltip.text(d[data.chart.tooltip])
					.style("left", (d3.event.pageX) + "px")     
					.style("top", (d3.event.pageY - 25) + "px");

				}

			})
			.on("mouseout",function(d){
				tooltip.transition()
				.duration(200)
				.style("opacity","0");
			});

		}
		

		var g = svg.selectAll(".column")
		.data(columns)
		.enter().append("svg:g")
		.attr("class", "column")
		.style({"font-family":data.chart.font})
		.attr("transform", function(d) {return "translate(" + x(d) + ")"; })
		.call(d3.behavior.drag()
				.origin(function(d) { return {x: x(d)}; })
				.on("dragstart", dragstart)
				.on("drag", drag)
				.on("dragend", dragend));

		// Axis
		g.append("svg:g")
		.attr("class","axis")
		.each(function(d) { d3.select(this).call(axis.scale(y[d])); })
		.append("svg:text")
		.attr("text-anchor", "middle")
		.attr("y", -data.axis.axisColNamePadd)
		.text(String)
		.style({"cursor":"move"});

		g.selectAll(".axis line, .axis path").style({"fill":"none","stroke": data.axis.axisColor,"shape-rendering": "crispEdges"});

		// Add a brush for each axis.
		g.append("svg:g")
		.style({"fill-opacity":" .3","stroke":data.axis.brushColor,"shape-rendering":" crispEdges"})
		.each(function(d) { d3.select(this).call(y[d].brush); })
		.selectAll("rect")
		.attr("x", brushx)
		.attr("width", brushWidth);

	}

	else{

//		var emptyMsgFontSize = parseInt(data.emptymessage.style.fontSize);
//		var emptyMsgDivHeight = parseInt(data.emptymessage.height);
//		var emptyMsgTotal = emptyMsgDivHeight+emptyMsgFontSize/2;

		// Set title
		d3.select("body").append("div")
//		.style("height",emptyMsgTotal)
//		.style("position",data.emptymessage.position)
//		.style("left",data.emptymessage.paddingLeft)
		.style("color",data.emptymessage.style.color)
		.style("text-align",data.emptymessage.style.align)
		.style("font-family",data.emptymessage.style.fontFamily)
		.style("font-style",data.emptymessage.style.fontWeight)
		.style("font-size",data.emptymessage.style.fontSize)
		.text(data.emptymessage.text);	

	}

	// TABLE
	var initialTableData=records;

	var allTableData=initialTableData; // all records or filtered records
	var currentTableData=allTableData.slice(0,5); // up to 5 recoords
	var firstDisplayed=1;
	var lastDisplayed=0;
	if(allTableData.length > 5){
		lastDisplayed=5;
	}else{
		lastDisplayed=allTableData.length;
	}

	var tableDiv=d3.select("body").append("div").attr("id","tableDiv").style("padding-top",20);
	var table= tableDiv.append("table").style("width",w+m[3]).style("padding-left",m[3]);
	var paginationBar=tableDiv.append("div").attr("id","pBar").style("padding-left",w/2+m[3]/2);
	var prevButton=paginationBar.append("button").text("<< Prev").on("click",function(){return showPrev();});
	var paginationText= paginationBar.append("label").text(" "+firstDisplayed+" to "+lastDisplayed+" of "+allTableData.length).style("font-weight","bold");
	var nextButton=paginationBar.append("button").text("Next >>").on("click",function(){return showNext();});

	if(firstDisplayed===1){
		prevButton.attr("disabled","true");	
	}

	if(lastDisplayed===allTableData.length){
		nextButton.attr("disabled","true");
	}

	//columns for table
	var tableColumns=[];
	tableColumns.push(groupcolumn);
	tableColumns.push(data.chart.tooltip);
	tableColumns=tableColumns.concat(columns);

	
	//table header
	table.append("thead")
	      .style("background-color","silver") 
	      .style("border","1px solid black")
	      .attr("border-collapse","collapse")
	     .append("tr")
	      .style("height","30px")
	     .selectAll("th")
	     .data(tableColumns).enter()
	     .append("th")
	     .text(function(d){return d;});
	
	//table body
	table.append("tbody")
	     .selectAll("tr")
	.data(currentTableData)
	     .enter()
	     .append("tr")
	     .style("background-color",function(d,i){
	    	 if(i%2==1)return "lightgray";
	     })
	     .attr("class","tdata")
	.on("mouseover",function(d){
		d3.select(this).style("outline","solid dimgray");
		return selectSingleLine(d);})
	     .on("mouseout",function(d){
		d3.select(this).style("outline","none");
	    	foreground.style({ "fill": "none", "stroke-opacity": ".5","stroke-width": "2px"})
	 		.style({"stroke":function(d) { return myColors(d[groupcolumn]);}});
           })
	     .selectAll("td")
	     .data(function(row){
	    	 return tableColumns.map(function(column) {
	                return {column: column, value: row[column]};
	            });
	     }).enter()
	       .append("td")
	.on("click",function(d){return filterTable(d,allTableData);})
	       .text(function(d){return d.value})
	       .style("text-align","center");
	       

	function dragstart(d) {
		i = columns.indexOf(d);
	}

	function drag(d) {
		x.range()[i] = d3.event.x;
		columns.sort(function(a, b) { return x(a) - x(b); });
		g.attr("transform", function(d) { return "translate(" + x(d) + ")"; });
		foreground.attr("d", path);
	}

	function dragend(d) {

		x.domain(columns).rangePoints([0, w]);
		var t = d3.transition().duration(500);
		t.selectAll(".column").attr("transform", function(d) { 
			return "translate(" + x(d) + ")"; });
		t.selectAll(".foreground path").attr("d", path);

	}

	// Returns the path for a given data point.
	function path(d) {
		return line(columns.map(function(p) { 
			return [x(p), y[p](d[p])]; }));
	}

	// Handles a brush event, toggling the display of foreground lines.
	function brush() {
		var actives = columns.filter(function(p) { return !y[p].brush.empty(); }),
		extents = actives.map(function(p) { return y[p].brush.extent(); });
		foreground.classed("fade", function(d) {

			return !actives.every(function(p, i) {

				return extents[i][0] <= d[p] && d[p] <= extents[i][1];
			});
		});

		foreground.classed("notfade", function(d) {
			return actives.every(function(p, i) {
				return extents[i][0] <= d[p] && d[p] <= extents[i][1];
			})
		});

		var allRows=records;
		
		filteredRows=allRows.filter(function(d) {
         
			return actives.every(function(p, i) {

				return extents[i][0] <= d[p] && d[p] <= extents[i][1];
			});
		});
		
		nextButton.attr("disabled",null);
		prevButton.attr("disabled",null);

		allTableData=filteredRows;
		
		currentTableData=allTableData.slice(0,5);
		firstDisplayed=1;
		if(allTableData.length > 5){
			lastDisplayed=5;
		}else{
			lastDisplayed=allTableData.length;
		}

		if(firstDisplayed===1){
			prevButton.attr("disabled","true");	
		}

		if(lastDisplayed===allTableData.length){
			nextButton.attr("disabled","true");
		}
		paginationText.text(" "+firstDisplayed+" to "+lastDisplayed+" of "+allTableData.length).style("font-weight","bold");
		var dummy=[];
		d3.select("table").select("tbody").selectAll("tr").data(dummy).exit().remove();
		
		 d3.select("table")
		   .select("tbody")
		   .selectAll("tr")
		.data(currentTableData)
		   .enter()
		   .append("tr")
	       .style("background-color",function(d,i){
	    	 if(i%2==1)return "lightgray";
	        })
		    .attr("class","tdata") 
		.on("mouseover",function(d){ 
			d3.select(this).style("outline","solid dimgray");
			return selectSingleLine(d);
			})
	     .on("mouseout",function(d){
			d3.select(this).style("outline","none");
	    	d3.selectAll(".notfade").style({ "fill": "none", "stroke-opacity": ".5","stroke-width": "2px"})
	 		.style({"stroke":function(d) { return myColors(d[groupcolumn]);}});
           })
	     .selectAll("td")
	     .data(function(row){
	    	 return tableColumns.map(function(column) {
	                return {column: column, value: row[column]};
	            });
	     }).enter()
	       .append("td")
		.on("click",function(d){return filterTable(d,filteredRows);})
	       .text(function(d){return d.value})
		   .style("text-align","center");
		 
		
		d3.selectAll(".fade").style({"stroke": "#000","stroke-opacity": ".02"}); 
		d3.selectAll(".notfade").style({ "fill": "none", "stroke-opacity": ".5","stroke-width": "2px"})
		.style({"stroke" :function(d) { return myColors(d[groupcolumn]);}});


	}

	function selectSingleLine(selectedRow){
		foreground.attr("visible", function(d){
          return (d===selectedRow)?"true":"false";
      });
		
	

		d3.select(".foreground").selectAll("[visible=false]").style({"stroke": "#000","stroke-opacity": ".02"}); 
		d3.select(".foreground").selectAll("[visible=true]").style({ "fill": "none", "stroke-opacity": ".5","stroke-width": "2px"})
		.style({"stroke" :function(d) { return myColors(d[groupcolumn]);}});
	}

	function filterTable(selectedCell,coollectionToFilter){
		
		nextButton.attr("disabled",null);
		prevButton.attr("disabled",null);

		var filteredData=coollectionToFilter.filter(function(d){return d[selectedCell.column]===selectedCell.value;});		

		allTableData=filteredData;
		currentTableData=allTableData.slice(0,5);
		firstDisplayed=1;
		if(allTableData.length > 5){
			lastDisplayed=5;
		}else{
			lastDisplayed=allTableData.length;
		}
		if(firstDisplayed===1){
			prevButton.attr("disabled","true");	
		}

		if(lastDisplayed===allTableData.length){
			nextButton.attr("disabled","true");
		}
		paginationText.text(" "+firstDisplayed+" to "+lastDisplayed+" of "+allTableData.length).style("font-weight","bold");

		var dummy=[];
		d3.select("table").select("tbody").selectAll("tr").data(dummy).exit().remove();

		d3.select("table")
		.select("tbody")
		.selectAll("tr")
		.data(currentTableData)
		.enter()
		.append("tr")
		.style("background-color",function(d,i){
			if(i%2==1)return "lightgray";
		})
		.attr("class","tdata") 
		.on("mouseover",function(d){
			d3.select(this).style("outline","solid dimgray");
			return selectSingleLine(d);
			})
		.on("mouseout",function(d){
  
			d3.select(this).style("outline","none");
			foreground.attr("visible", function(d){
				return (d[selectedCell.column]===selectedCell.value)?"true":"false";
			});

			d3.selectAll(".fade").attr("visible","false");
			d3.selectAll(".notfade").attr("visible", function(d){
				return (d[selectedCell.column]===selectedCell.value)?"true":"false";
			});

			d3.select(".foreground").selectAll("[visible=false]").style({"stroke": "#000","stroke-opacity": ".02"}); 
			d3.select(".foreground").selectAll("[visible=true]").style({ "fill": "none", "stroke-opacity": ".5","stroke-width": "2px"})
			.style({"stroke" :function(d) { return myColors(d[groupcolumn]);}});

			//foreground.selectAll(".fade").style({"stroke": "#000","stroke-opacity": ".02"});
		})
		.selectAll("td")
		.data(function(row){
			return tableColumns.map(function(column) {
				return {column: column, value: row[column]};
			});
		}).enter()
		.append("td")
		.text(function(d){return d.value})
		.style("text-align","center");



	}

	function updateTable(){
		var dummy=[];
		d3.select("table").select("tbody").selectAll("tr").data(dummy).exit().remove();

		d3.select("table")
		.select("tbody")
		.selectAll("tr")
		.data(currentTableData)
		.enter()
		.append("tr")
		.style("background-color",function(d,i){
			if(i%2==1)return "lightgray";
		})
		.attr("class","tdata") 
		.on("mouseover",function(d){ 			
			d3.select(this).style("outline","solid dimgray");
			return selectSingleLine(d);})
		.on("mouseout",function(){
			d3.select(this).style("outline","none");
			foreground.attr("visible",function(d){
				return (allTableData.indexOf(d)!=-1)?"true":"false";
			});

			d3.select(".foreground").selectAll("[visible=false]").style({"stroke": "#000","stroke-opacity": ".02"}); 
			d3.select(".foreground").selectAll("[visible=true]").style({ "fill": "none", "stroke-opacity": ".5","stroke-width": "2px"})
			.style({"stroke" :function(d) { return myColors(d[groupcolumn]);}});


		})
		.selectAll("td")
		.data(function(row){
			return tableColumns.map(function(column) {
				return {column: column, value: row[column]};
			});
		}).enter()
		.append("td")
		.on("click",function(d){return filterTable(d,allTableData);})
		.text(function(d){return d.value})
		.style("text-align","center");

		foreground.attr("visible",function(d){
			return (allTableData.indexOf(d)!=-1)?"true":"false";
		});

	d3.select(".foreground").selectAll("[visible=false]").style({"stroke": "#000","stroke-opacity": ".02"}); 
	d3.select(".foreground").selectAll("[visible=true]").style({ "fill": "none", "stroke-opacity": ".5","stroke-width": "2px"})
	.style({"stroke" :function(d) { return myColors(d[groupcolumn]);}});
	}

	function showNext(){
		prevButton.attr("disabled",null);
		firstDisplayed=firstDisplayed+5;
		lastDisplayed=lastDisplayed+5;
		if(lastDisplayed>allTableData.length){
			lastDisplayed=allTableData.length;
		}



		currentTableData=[];
		currentTableData=allTableData.slice(firstDisplayed-1,lastDisplayed);



		if(lastDisplayed === allTableData.length){
			nextButton.attr("disabled","true");
		}



		paginationText.text(" "+firstDisplayed+" to "+lastDisplayed+" of "+allTableData.length).style("font-weight","bold");
		updateTable();	


	}

	function showPrev(){
		nextButton.attr("disabled",null);
		firstDisplayed=firstDisplayed-5;
		if(lastDisplayed===allTableData.length){
			if(allTableData.length%5!=0){
				lastDisplayed=lastDisplayed-(allTableData.length%5);
			}else{
				lastDisplayed=lastDisplayed-5;	
			}
		}
		else{
			lastDisplayed=lastDisplayed-5;
		}



		currentTableData=[];
		currentTableData=allTableData.slice(firstDisplayed-1,lastDisplayed);

		if(firstDisplayed===1){
			prevButton.attr("disabled","true");	
		}

		paginationText.text(" "+firstDisplayed+" to "+lastDisplayed+" of "+allTableData.length).style("font-weight","bold");
		updateTable();	

	}
}
	
/**
 * Javascript function that serves for rendering the CHORD chart
 * @param jsonData Input data in JSON format, needed for rendering the chart on the client side
 */
function renderChordChart(jsonData)
{
//	console.log(jsonData);
	
	/**
	 *  'opacityMouseOver' - value for the opacity of the item (row) that is covered by the mouse pointer and all the items 
	 *  that are linked (connected) to that row (item)
	 *  
	 *  'opacityMouseOutAndDefault' - value of the opacity of all graphical items (arcs and stripes) when non of the items 
	 *  (rows) is selected by the mouse pointer or when the mouse pointer leaves an item
	 */
	 // TODO: Maybe customizable ???
	var opacityMouseOutAndDefault = 0.6;
	var opacityMouseOver = 0.1;
	
	/**
	 * 'allFieldsObject' - object that contains information about the data that we got from the server. Particularly we get
	 * data about the rows and columns that our matrix (will) contain
	 * 
	 * 'allFieldsArray' - array of all rows/columns items (fields) sorted in alphabetically ascending order that matrix (will)
	 *  contain. This way can sort all rows and columns of the future matrix in the same, alphabetically ascending, order
	 */
	var allFieldsObject = jsonData.data[0].metaData.fields;
	var allFieldsArray = new Array();
	 
	 /**
  	  * 'columnsPairedWithRows' - contains data about which columns are linked to the particular row, that is, which column is in
  	  * the intersection with the particular row and what is the value of their intersection (the value of the matrix field). We 
  	  * will need this data to see outgoing items (columns to which particular row is connected). 
  	  * 
  	  * 'rowsPairedWithColumns' - containes data about which rows are connected to the particular column (we will need this data
  	  * in pair woth the previous one - columnsPairedWithRows). We will need this to see incoming items (which rows (items) are
  	  * connected to the particular item (in this case, column))
  	  */
  	 var columnsPairedWithRows = new Array();	
  	 var rowsPairedWithColumns = new Array();
	
	/**
	 * TODO: NOT USED: Useful when filtering is enabled (FILTER tags attribute 'value' is set to 'true')
	 */
	function contains(a, obj) {
	    for (var i = 0; i < a.length; i++) {
	        if (a[i].value === obj) {
	            return true;
	        }
	    }
	    return false;
   }

	/**
	 * TODO: NOT USED: Useful when filtering is enabled (FILTER tags attribute 'value' is set to 'true')
	 */
   function getIndex(a, obj) {
	    for (var i = 0; i < a.length; i++) {
	        if (a[i].value === obj) {
	            return a[i].index;
	        }
	    }
	    return -1;
   }

   /**
    * Returns an array of tick angles and labels, given a group.
    */
   // TODO: Customize text that goes next to the ticks (here it is 'k') ???
   function groupTicks(d)     
   {   	
		var k = (d.endAngle - d.startAngle) / d.value;
		
		return d3.range(0, d.value, 1000).map(function(v, i) {			
			return {
				startAngle: d.startAngle,
				endAngle: d.endAngle,
				angle: v * k + d.startAngle,
				label: i % 5 ? null : v / 1000 + "k"
				};
			});
   }
	
   /**
    * 'deselectClickedItem' - indicator if user clicked on some item on the chart - if false, prevent mouse over 
    * and mouse out events. If true every item on the chart should be deselected - full colored
    * 
    * 'indexOfItemSelected' - index of the item of the chart that is selected. We need this parameter to take care
    * if we should
    */
    var deselectClickedItem = undefined;
    var indexOfItemSelected = -1;
    var previouslySelected = false;
    
    var selectedSomeItem = false;
    var indexOfSelectedItem = -1;
    var enableMouseOver = true;
    var enableMouseOut = true;
    var enableOtherSelect = false;
        
    /**
     * Returns an event handler for fading a given chord group.
     */
	function fadeMouseOver()
	{	
		return function(g, i) {
			
//				console.log(i);
//				
//				console.log(columnsPairedWithRows[i]);
//				console.log("row: " + columnsPairedWithRows[i].row);
//				console.log("columnsPaired: ");
//				
//				// To which columns is this row linked to (column name + value)
//				for (var j=0; j<columnsPairedWithRows[i].pairedWith.length; j++)
//				{
//					console.log(columnsPairedWithRows[i].pairedWith[j].column);
//					console.log(columnsPairedWithRows[i].pairedWith[j].value);
//				}
//				
//				console.log("column: " + rowsPairedWithColumns[i].column);
//				console.log("rowsPaired: ");
//				
//				// To which columns is this row linked to (name + value)
//				for (var k=0; k<rowsPairedWithColumns[i].pairedWith.length; k++)
//				{
//					if (rowsPairedWithColumns[i].column != rowsPairedWithColumns[i].pairedWith[k].row)
//					{
//						console.log(rowsPairedWithColumns[i].pairedWith[k].row);
//						console.log(rowsPairedWithColumns[i].pairedWith[k].value);	
//					}				
//				}	
			
			setParamsClickAndMouseOver(g,i,false);
			
//			if (deselectClickedItem==undefined || deselectClickedItem==true || (previouslySelected == true && deselectClickedItem==false))
			/**
			 * With filtering we are getting pairs of stripes: one member of the pair is the source item (the row) whose 
			 * outgoing stripe(s) we need to leave as default color (darker); the second member of the pair is the target
			 * item's stripe (both linking two items: source and target) that is coming into the source item (the row). 
			 * We also need to leave this, target item's stripe as default color (darker).
			 * 
			 * The same logic, just in other direction is for this part inside the 'fadeMouseOut' function - those stripes
			 * (that we mentioned in previous paragraph) need to be reset as default color (dark) except those that are the
			 * subject of our discussion: the soure and target item's stripe (links between them).
			 */
			if (enableMouseOver)
			{		
				svg.selectAll(".chord path")
				 	.filter(function(d) { return d.source.index != i && d.target.index != i; })
				 	.transition()
				 	.style("opacity", opacityMouseOver);				
			}
		}
	}
	
	function fadeMouseOut()
	{
		return function(g, i) 
		{		
			setParamsClickAndMouseOver(g,i,false);
			
//			if ((deselectClickedItem==undefined || deselectClickedItem==true) && previouslySelected==false)
			if (enableMouseOut)
			{
				svg.selectAll(".chord path")
				 	.filter(function(d) { return d.source.index != i && d.target.index != i; })
				 	.transition()
				 	.style("opacity", opacityMouseOutAndDefault);
			}			
		};
	}

	function clickOnItem()
	{
		return function(g, i) 
		{	
			setParamsClickAndMouseOver(g,i,true);
				
			/**
			 * Reset all stripes to the default (mouse out, darker) color.
			 */
			svg.selectAll(".chord path")
			 	.filter(function(d) { return true; })
			 	.transition()
			 	.style("opacity", opacityMouseOutAndDefault);
				
			/**
			 * Find the one (stripes that link target and source items) that we need to leave as default 
			 * (darker, mouse out) color. Other stripes will be shadowed (lighter (mouse over) color).
			 */
			svg.selectAll(".chord path")
				.filter(function(d) { return d.source.index != i && d.target.index != i; })
			 	.transition()
			 	.style("opacity", opacityMouseOver);		
		};
	}
	
	/**
	 * Set parameters that are necessary for the events that we are listening to: the mouse over and click event.
	 * According to these parameters we are going to control when should we enable or disable listening to the 
	 * mouse over and/or mouse out events.
	 */
	function setParamsClickAndMouseOver(d,i,isClick)
	{
		/**
		 * The function responsible for processing the 'click' event listener's call is calling this function.
		 * This function is not called by the 'fadeMouseOver'/'fadeMouseOut' functions that are responsible
		 * for processing the 'mouseover'/'mouseout' event listener's call.
		 */
		if (isClick)
		{			 
			enableMouseOver = false;
			 
			/**
			 * No item is selected (clicked) on the chart - select it and freeze the chart.
			 */
			if (selectedSomeItem == false)
			{
				selectedSomeItem = true;		
				enableMouseOut = false;		
				indexOfSelectedItem = i;	
				
				/**
				 * TODO:
				 * 		Temporary function for printing out the items (source and target) that are the
				 * 		result of the selection (clicking) operation on the chart's item.
				 */
				printTheResultWhenSelecting(i);
			}
			/**
			 * Some item is already selected (the chart is still freeze).
			 */
			else 
			{
				/**
				 * The item that is now clicked (selected) is already selected, hence we need to deselect it and
				 * unfreeze the chart.
				 */
				if (indexOfSelectedItem == i)
				{
					selectedSomeItem = false;	
					enableMouseOut = true;		
					indexOfSelectedItem = -1;	
				}
				/**
				 * The item that we have now clicked (selected) is different for the one that is alreday selected,
				 * hence select the newly clicked (selected) item and keep the chart freeze.
				 */
				else
				{
					selectedSomeItem = true;	
					enableMouseOut = false;	
					indexOfSelectedItem = i;	
					
					printTheResultWhenSelecting(i);
				}
			}
		}
		/**
		 * This function is called by the 'fadeMouseOver'/'fadeMouseOut' functions that are responsible
		 * for processing the 'mouseover'/'mouseout' event listener's call.
		 */
		else 
		{
			/**
			 * if-block: 
			 * 		None of items (arcs) is selected (clicked) - the chart us 'unfreeze'
			 * else-block:
			 * 		Some item (arc) is selected (clicked) - the chart is 'freeze'
			 */
			if (selectedSomeItem == false)		
			{
				enableMouseOver = true;		
				enableMouseOut = true; 		
			}
			else
			{
				enableMouseOver = false;	
				enableMouseOut = false;		
			}				 
		}

//			/**
//			  * Select particular item on the chart (freeze the chart)
//			  */
//		 
//			 if ((deselectClickedItem == undefined || indexOfItemSelected == -1) && previouslySelected==false)
//			 {
//				 console.log("++ 1 ++");
//				 deselectClickedItem = false;
//				 indexOfItemSelected = i; 
//				 
//				 previouslySelected = true;
//	 			
////	 			// With which columns is this (selected, clicked) row paired 
////	 			console.log(columnsPairedWithRows[i]);
////	 			// Which columns are paired with this (selected, clicked) row 
////		 		console.log(rowsPairedWithColumns[i]);
//			 }  		 			
//			 /**
//			  * Deselect particular (already selected) item on the chart (unfreeze the chart)
//			  */
////			else if (indexOfItemSelected == i || (deselectClickedItem == true && indexOfItemSelected != i))
//			 else if ((indexOfItemSelected == i && deselectClickedItem==false) && previouslySelected == true)
//			 { 		
//				 console.log("++ 2 ++");
//				 indexOfItemSelected = -1;				 				
//				 deselectClickedItem = !deselectClickedItem;  	
//				 
//				 previouslySelected = false;
//				 
////					// With which columns is this (selected, clicked) row paired 
////	 				console.log(columnsPairedWithRows[i]);
////	 				// Which columns are paired with this (selected, clicked) row 
////	 		 		console.log(rowsPairedWithColumns[i]);							
//			 } 	 	
//			 else if (previouslySelected == true && deselectClickedItem==false && indexOfItemSelected!=-1 && indexOfItemSelected != i)
//			 {
//				 console.log("++ 3 ++");
////				 deselectClickedItem = false;
//				 indexOfItemSelected = i;
//				 
//				 fadeMouseOver();
//			 }
//	 		
//			 console.log("--- IZLAZ ---");
//			 console.log(indexOfItemSelected);
//			 console.log(deselectClickedItem);
	}
	
	function printTheResultWhenSelecting(i)
	{
		// With which columns is this (selected, clicked) row paired 
		console.log(columnsPairedWithRows[i]);
		// Which columns are paired with this (selected, clicked) row 
		console.log(rowsPairedWithColumns[i]);
	}
	
	
	/**
	 * Width and height of the chart
	 */
	var width = jsonData.chart.width;
	var height = jsonData.chart.height;
	
	var innerRadius = Math.min(width, height) * .3;
    var outerRadius = innerRadius * 1.1;
    
    /**
     * Number of row/column elements of the squared martix
     */
    var elemSize = jsonData.data[0].results;
	
	var fill = d3.scale.ordinal()
    			.domain(d3.range(elemSize))
				.range(jsonData.colors);
		
	// Set title
	d3.select("body").append("div")
		.style("color",jsonData.title.style.color)
		.style("text-align",jsonData.title.style.align)
		.style("font-family",jsonData.title.style.fontFamily)
		.style("font-style",jsonData.title.style.fontWeight)
		.style("font-size",jsonData.title.style.fontSize)
		.text(jsonData.title.text);

	// Set subtitle
	d3.select("body").append("div")
		.style("color",jsonData.subtitle.style.color)
		.style("text-align",jsonData.subtitle.style.align)
		.style("font-family",jsonData.subtitle.style.fontFamily)
		.style("font-style",jsonData.subtitle.style.fontWeight)
		.style("font-size",jsonData.subtitle.style.fontSize)
		.text(jsonData.subtitle.text);
	
	/* TODO: Enable and customize empty DIV of specified height in order to make some space between the subtitle and
	 * the chart (values on ticks) ??? */
	var emptySplitDivHeight = 60;
	d3.select("body").append("div").style("height", emptySplitDivHeight);
	
	d3.select("body").append("div").attr("id","chartD3").attr("align","center");
	
	var svg = d3.select("#chartD3").append("div")
	 			.attr("class", "chart")	 			
	 			.style("width", width + "px")
	 			.style("height", height-100)	 			
				.append("svg:svg")
				.attr("width", width)
				.attr("height", height)				
				.append("svg:g")
				.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
	
	/**
	 * [START] Data processing part
	 */
	var rows = jsonData.data[0].rows;
	//var source,target,value;
	
	var matrix = new Array(elemSize);
	
	for (var i = 0; i < matrix.length;i++)
	{
		matrix[i] = new Array(elemSize);
	}	
	 	
	// use dataset as-is		
	 for (i = 0; i < rows.length; i++) 
	 {		 
		 for (j = 0; j < elemSize; j++) 
		 {
			var column = 'column_'+(j+1);			
			matrix[i][j] = parseFloat(rows[i][column]);
		 };	
  	 };  	 
  	 
  	 // Variable that will let us render this chart part, but preventing listening for the mouseover event
  	 var arcs = null;

//  	 console.log(rows);
  	 
  	/**
  	  * Which column is paired with which row (row is the initial point of view)
  	  * - 	array of objects that are composed of row attribute and its array of 
  	  * 	columns that are intersected with it and have value != 0
  	  */
  	 
  	 for (var i=0; i<allFieldsObject.length; i++)
	 {
  		 var tempObject = {};
  		 var arrayOfColumnsAndValues = new Array();
  		 
  		 var rowName = allFieldsObject[i].header;  		 
  		 allFieldsArray.push(rowName);
  		 
  		 tempObject.row = allFieldsObject[i].header;
  		 
  		 for (var j=0; j<allFieldsObject.length; j++)
		 {
  			 var tempSubArrayObjects = {};
  			 
  			 if (rows[i]["column_"+(j+1)] != 0)
			 {
  				tempSubArrayObjects.column = allFieldsObject[j].header;
  				tempSubArrayObjects.value = rows[i]["column_"+(j+1)];
  				
  				arrayOfColumnsAndValues.push(tempSubArrayObjects);
			 }  			
		 }
  		 
  		 tempObject.pairedWith = arrayOfColumnsAndValues;
  		 
  		 columnsPairedWithRows.push(tempObject);
	 }

  	 // draw the graph before getting data for populating table in the legend (no loosing time)
	 drawGraph(matrix); 
  	 
  	 for (var i=0; i<allFieldsObject.length; i++)
	 {
  		 var columnName = allFieldsObject[i].header;
  		 
  		 var tempObject = {};
  		 
  		 var tempArray = new Array();
  		 
  		 tempObject.column = columnName;
  		 
  		 // go through all rows for this (i-th) column
  		 for (var j=0; j<allFieldsObject.length; j++)
		 {
  			 var rowName = allFieldsObject[j].header;
  			 var tempArraysObject = {};
  			 
  			 /**
  			  * "... && rowName!=columnName" => we do not need information about intersection of this columns with the row of the same name (i,i), 
  			  * since we got this information when populating the 'columnsPairedWithRows' array. We do must not duplicate the data.
  			  */
  			 // TODO: Should I leave the rows that we already found as intersected with the actual column? Maybe for two separate tables?
  			 if (rows[j]["column_"+(i+1)] != 0 && rowName!=columnName)
			 {
  				 tempArraysObject.row = rowName;
  				 tempArraysObject.value = rows[j]["column_"+(i+1)];
  				 
  				 tempArray.push(tempArraysObject);
			 }  				
		 }
  		 
  		 tempObject.pairedWith = tempArray; 
  		 
  		 rowsPairedWithColumns.push(tempObject);
	 }  	 
  	 
  	 // since we have all the data, enable fading of stripes and rendering the table in legend
  	 arcs.on("mouseover", fadeMouseOver())	
  	 	 .on("mouseout", fadeMouseOut());
  	   	 
  	 arcs.on
  	 (
		 "click", clickOnItem()
  	 );
	 
	 function drawGraph(matrix)
	 {
		 /**
		  * The chord layout is designed to work in conjunction with the chord shape and the arc shape. 
		  * The layout is used to generate data objects which describe the chords, serving as input to 
		  * the chord shape. The layout also generates descriptions for the groups, which can be used as 
		  * input to the arc shape. 
		  * 
		  * Data is specified by setting the associated matrix. 
		  * 
		  * IMPORTANT: 	The input matrix must be a square matrix of numbers.
		  * IMPORTANT: 	Each column i in the matrix corresponds to the same group as row i; the cell ij 
		  * 			corresponds to the relationship from group i to group j.
		  * 
		  * (from: https://github.com/mbostock/d3/wiki/Chord-Layout)
		  */
		 var chord = d3.layout.chord()
		  .padding(.05)	// TODO: Customize ???
		  .sortSubgroups(d3.descending)
		  .matrix(matrix);		
		 
		 // draws circles and defines the effect on the passage mouse
		var arcs1 = svg.append("svg:g").selectAll("path")
			.data(chord.groups)
			.enter();
			
		arcs =	arcs1.append("svg:path")
			.style("fill", function(d) { return fill(d.index); })
			.style("stroke", function(d) { return fill(d.index); })
			.attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius));			

		 // TODO: Customize color of number values on ticks ???
		 var ticks1 = svg.append("svg:g").selectAll("g")
			.data(chord.groups)
			.enter();
			
		var	ticks = ticks1.append("svg:g").selectAll("g")
			.data(groupTicks)
			.enter().append("svg:g")
			.attr("transform", function(d) {
				return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
				   + "translate(" + outerRadius + ",0)";
				});
		
		ticks1.append("svg:text")
		.attr("id","aaa")
		  .each(function(d,i) {  d.angle = (d.startAngle + d.endAngle) / 2; })
		   .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
		  .attr("transform", function(d) {
				return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
				+ "translate(" + (innerRadius + 60) + ")"
				+ (d.angle > Math.PI ? "rotate(180)" : "");
		  })
//		  .style("font-weight","bold")
		  .text(function(d,i) { return allFieldsArray[i];})
		  

		 //aggiunge le lineette "graduate"		 
		 ticks.append("svg:line")
			.attr("x1", "1")
			.attr("y1", "0")
			.attr("x2", "5")
			.attr("y2", "0")
			.style("stroke", "#FF0000");	// TODO: Customize the color of ticks ???

		 //aggiunge le label unit� di misura
		 ticks.append("svg:text")
			.attr("x", "8")
			.attr("dy", ".35em")
			.attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180)translate(-16)" : null; })
			.style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
			.text(function(d) { return d.label; });
			
		 //disegna le fasce da un'area ad un altra
		 svg.append("svg:g")
			.attr("class", "chord")
			.selectAll("path")
			.data(chord.chords)
			.enter().append("svg:path")
			.attr("d", d3.svg.chord().radius(innerRadius))
			.style("fill", function(d) { return fill(d.target.index); })
			.style("opacity", opacityMouseOutAndDefault) 
			.style("stroke", "#000")	// TODO: Customize ??
			.style("stroke-width", ".5px");	// TODO: Customize ??
		 
		}
	 
	 /**
	 * [END] Data processing part
	 */
}