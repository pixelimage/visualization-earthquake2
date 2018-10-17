
var mapCount = 0;

var daytimes = [
	"7:04-16:57",
	"6:44-17:28",
	"6:08-17:54",
	"5:25-18:19",
	"4:53-18:43",
	"4:41-19:02",
	"4:52-19:02",
	"5:15-18:38",
	"5:38-17:56",
	"6:01-17:14",
	"6:30-16:42",
	"6:57-16:36",
]
for (var i = 0; i < daytimes.length ; i++) {
	var s = daytimes[i].split("-")
	var s1 = s[0].split(":")
	var s2 = s[1].split(":")
	daytimes[i] = [
		Number( s1[0]) + (1/60*Number(s1[1])) - 0.5,
		Number( s2[0]) + (1/60*Number(s2[1])) - 1
	]
}

/* ----------------------------------------------------------
Map
---------------------------------------------------------- */

class Map{
	constructor(_svg,_view,_setting,_rect,_offset){
		this.svg = _svg;
		this.view = _view;
		this.view.attr("style","display:none;")
		this.rect = _rect;
		this.offset = _offset;
		this.id = mapCount;
		this.v = {}
		this.gs = {}
		this.setting = _setting
		this.monthNo = this.setting.startDate.getMonth();
		this.gs.map = _d3.addG(this.view,"",this.offset);
		_d3.addI(this.gs.map,"","0,-3,550,550",'./images/bg.png')
		this.v.night = _d3.addI(this.gs.map,"","0,-3,550,550",'./images/bg_night.png')

		// this.gs.map_bg2 	= _d3.addG(this.gs.map)
		// this.gs.map_bg 		= _d3.addG(this.gs.map)
		this.gs.map_main 	= _d3.addG(this.gs.map)
		this.gs.map_text2 = _d3.addG(this.gs.map)
		this.gs.map_text 	= _d3.addG(this.gs.map)

		this.gs.date = _d3.addG(this.view,"","20,40")
		_d3.addT(this.gs.date,"t_label mod-min","0,25",this.setting.label)

		var id = "maskurl" + mapCount++;
		var clip = svg.append("clipPath").attr("id", id);
		_d3.addR(clip,"","0,0,"+this.rect);
		this.view.attr("clip-path", "url(#"+id+")")

		this.gs.notes = _d3.addG(this.view,"","20,130")
		this.gs.notes.attr("style","display:none");
		var notes = this.setting.notes.split("<br>")
		for (var i = 0; i < notes.length ; i++) {
			_d3.addT(this.gs.notes,"t_note2","0,"+13*i,notes[i])
		}
	}

	setData(_datas){
		var datas = {main:[],hi:[],hi2:[],name:[]}
		this.dateView  = new SVG_DateView (_d3.addG(this.gs.date,"mod-date","0,0"))
		this.dateView.update(this.setting.startDate)
		if(this.id == 0){
			this.clockView = new SVG_ClockView(_d3.addG(this.svg,"mod-clock","250,235"),35)
			this.clockView.update(this.setting.startDate)
		}

		var sd = this.setting.startDate.getTime()
		var ed = this.setting.endDate.getTime()
		// var ids = ["s7","s6s","s6","s5s","s5","s4","s3","s2","s1"]
		// var levels = {}
		// for (var i = 0; i < ids.length ; i++) {
		// 	levels[ids[i]] = [];
		// }
		var selects = []
		for (var i = 0; i < _datas.length ; i++) {
			var b = true;
			//date
			if(sd > _datas[i].date.getTime()) b = false;
			if(ed < _datas[i].date.getTime()) b = false;
			if(b) {
				var int = _datas[i].intensity = treatIntensity(_datas[i].intensity)
				_datas[i].mag = _datas[i].mag.split("M").join("")
				_datas[i].mag = _datas[i].mag.split("Ｍ").join("")
				_datas[i].mag2 = Math.floor(_datas[i].mag)
				// levels["s"+int].push(_datas[i]);
				selects.push(_datas[i]);
			}
		}
		datas.main = selects.reverse();
		for (var i = 0; i < datas.main.length ; i++) {
			var tar = datas.main[i]
				if(tar.intensity == "s7" || tar.intensity == "s6s" || tar.intensity == "s6" ){
					datas.hi.push(tar)
				}
				if(tar.mag > 5.0 ){
					datas.hi2.push(tar)
				}
		}
		datas.hi2 = _.sortBy(datas.hi2, [function(o) { return o.mag; }]);
		// for (var i = 0; i < ids.length ; i++) {
		// 	for (var g = 0; g < levels[ids[i]].length ; g++) {
		// 		var tar = levels[ids[i]][g]
		// 		datas.main.push(tar)
		// 		if(ids[i] == "s7" || ids[i] == "s6s" || ids[i] == "s6" ){
		// 			datas.hi.push(tar)
		// 		}
		// 		if(tar.mag > 6 ){
		// 			datas.hi2.push(tar)
		// 		}
		// 	}
		// }
		for (var i = 0; i < datas.main.length ; i++) {
			if(datas.main[i].name){
				datas.name.push(datas.main[i]);
			}
		}
		console.log("該当データ件数 : "+datas.main.length);
		this.datas = datas;
		return this;
	}

	stageInit(){
		this.view.attr("style","opacity:0;")
			.transition().duration(400)
				.attr("style","opacity:1;")
	}
	stageIn(){
		if(this.clockView) this.clockView.stageIn();
		setTimeout(() =>{
			this.projection = d3.geoMercator()
				.center([137.5, 39-0.1])
				.scale(1300)
				.translate([width / 2, height / 2]);
			this.drawMap()
			this.drawDate()
		},1000);
	}

	drawMap(){
		var datas = this.datas
		var ts = this.gs.map_text.selectAll("g").data(datas.name)
			.enter().append("g");
			ts.attr("class" , "hide")
				.attr("transform", d => this.getXY(d,[8,5]) )
				.transition().duration(100).delay((d,i) => this.getDelay(d.date))
				.attr("class" , "show")
				.transition().duration(100).delay(2000)
				.attr("class" , "hide")
			ts.append("text").attr("class","t_insident-name").text(d => "―" + d.name )
			ts.append("text").attr("class","t_insident-year mod-en").text(d => "　" + getState(d) ).attr("y",17)

		//line
		this.gs.map_main.selectAll("circle").data(datas.main)
			.enter().append("circle")
				.attr("class" , (d,i) =>  "stroke1 stroke1-w" + d.mag2 + " stroke1-c" + (Math.floor(i/100)*100))
				.attr("transform", d => this.getXY(d) )
				.attr("r" ,0 )
				// .attr("fill" , d => "rgba(255,255,0,"+ (d.mag/20 -0.2) +")" )
				.attr("fill" , d => "rgba(255,255,0,1)" )
				// .transition().duration(200).ease(d3.easeBackOut).delay((d,i) => this.getDelay(d.date))
				.transition().duration(200).delay((d,i) => this.getDelay(d.date))
					.attr("r" , d => getMugSize(d.mag)*1.2)
					// .attr("fill" ,"none" )
				 .transition().duration(200)
				 	.attr("fill" ,"rgba(255,255,0,0.0)" )
 				 	.attr("r" , d => getMugSize(d.mag)*0.2)
				 .transition().duration(400)
				 	.attr("r" , d => getMugSize(d.mag,2))
					// .attr("r" , d => getMugSize(d.Z) * 0.9)//.remove()

		//bg
		/*
		this.gs.map_bg.selectAll("circle").data(datas.main)
			.enter().append("circle")
				.attr("class" , d => getClass(d.intensity))
				.attr("transform", d => this.getXY(d) )
				.attr("r" ,0 )
				.transition().duration(100).delay((d,i) => this.getDelay(d.date))
						.attr("r" , d => getSize(d.intensity,2))

		this.gs.map_bg2.selectAll("circle").data(datas.hi)
			.enter().append("circle")
				.attr("class" , d => getClass(d.intensity))
				.attr("transform", d => this.getXY(d) )
				.attr("r" ,0 )
				.transition().duration(100).delay((d,i) => this.getDelay(d.date))
					.attr("r" , d => getSize(d.intensity,2) / 3 )
		*/
		this.gs.map_text2.selectAll("text").data(datas.hi2)
			.enter().append("text")
			.attr("transform", d => this.getXY(d) )
					.attr("class" , d => "mod-en t_mag " + "t_mag-"+Math.floor(d.mag) )
					.attr( "paint-order" , "stroke" )
					.attr( "style" , d => getMagFontSize(d.mag) )
				.transition().duration(100).delay((d,i) => this.getDelay(d.date))
					.text( d => "M" + d.mag )
				.transition().duration(600).remove()

	}

	drawDate(){
		var setting = this.setting
		var sd = setting.startDate.getTime()
		var ed = setting.endDate.getTime()
		var cd = new Date().getTime()
		var yid = setInterval(() => {
				var dd = new Date(sd + ( (new Date().getTime() - cd) * YEAR/setting.speed) );
				if(dd > ed){
					clearInterval(yid);
					this.dateView.update(setting.endDate)
					this.dateView.stageOut()
					if(this.clockView){
						this.clockView.update(setting.endDate)
						this.clockView.stageOut()
					}
					this.done()
				} else{
					this.dateView.update(dd)
					if(this.clockView)this.clockView.update(dd)
				}
				this.updateBg(dd.getHours() + ( 1/60 * dd.getMinutes()))
		},30);
	}
	done(){
		setTimeout(() => {
			this.gs.notes.attr("style","display:block;")
				.attr("style","opacity:0")
				.transition().duration(500).attr("style","opacity:1")
			this.updateBg(12)

		},1000);
	}
	updateBg(_h){
		var tar = daytimes[this.monthNo]
		if(this.cur === undefined){
			if(_h > tar[0] && _h < tar[1]){
				this.v.night.attr("style","opacity:0")
			}
		}
		var opa = 1;
		if(_h > tar[0] && _h < tar[1]){ opa = 0 }
		if(this.cur !== opa){
			this.v.night
				.transition().duration( 200 /*1500*/)
				.attr("style","opacity:"+opa)
			this.cur = opa;
		}
	}

	getXY(d,_offset){
		if(_offset === undefined)_offset = [0,0]
		var pos = this.projection([this._getXY(d.longitude ),this._getXY(d.latitude )])
		pos[0] += _offset[0]
		pos[1] += _offset[1]
		return "translate(" + pos + ")"
	}
	 _getXY(d){
		d = d.split("′N").join("")
		d = d.split("′E").join("")
		d = d.split("°")
		var a1 = Number(d[0])
		var a2 = Number(d[1]) / 60;
		return a1+a2;
	}
	getDelay(d){
		var cur = new Date(d).getTime() - this.setting.startDate
		var time = cur / YEAR;
		return time * this.setting.speed;
	}
}


/* ----------------------------------------------------------
functions
---------------------------------------------------------- */

var YEAR = 365.25 * 24 * 60 * 60* 1000;

function getClass(_s){
	return "stroke-level stroke-level-" + _s;
}
function treatIntensity(_s){
	_s = _s.replace(/[０-９]/g, function(s) {
		 return String.fromCharCode(s.charCodeAt(0) - 65248);
	 });
	if(_s == "5弱") _s = "5";
	if(_s == "5強") _s = "5s";
	if(_s == "6弱") _s = "5";
	if(_s == "6強") _s = "6s";
	return _s;
}
function getMugSize(_s,_flg){
	// if(_flg == 2) {
	// 	if(_s < 4.5){
	// 		return 0;
	// 	}
	// }
	var s =  _getMugSize(_s) * 0.5;
	return s
}
function _getMugSize(_s){
	var s = Math.round(_s*2)/2;
		if(s == "9.5") return 600;
		if(s == "9.0") return 300;
		if(s == "8.5") return 200;
		if(s == "8.0") return 150;
		if(s == "7.5") return 100;
		if(s == "7.0") return 70;
		if(s == "6.5") return 50;
		if(s == "6.0") return 40;
		if(s == "5.5") return 30;
		if(s == "5.0") return 20;
		if(s == "4.5") return 10;
		if(s == "4.0") return 5;
		if(s == "3.5") return 2;
		if(s == "3.0") return 1;
		if(s == "2.5") return 0;
		if(s == "2.0") return 0;
		if(s == "1.5") return 0;
		if(s == "1.0") return 0;
		if(s == "0.5") return 0;
}
function getSize(_s,_flg){
	if(_flg == 2){
		if(_s == "1") return 0;
		if(_s == "2") return 0;
		if(_s == "3") return 1;
		if(_s == "4") return 2;
		if(_s == "5") return 3;
		if(_s == "5s") return 6;
		if(_s == "6") return 10;
		if(_s == "6s") return 15;
		if(_s == "7") return 20;
	}
	if(_s == "1") return 1;
	if(_s == "2") return 3;
	if(_s == "3") return 5;
	if(_s == "4") return 10;
	if(_s == "5") return 40;
	if(_s == "5s") return 60;
	if(_s == "6") return 120;
	if(_s == "6s") return 200;
	if(_s == "7") return 300;
}

function getState(d){
	return d.date.getFullYear() + "/" + (d.date.getMonth()+1) + "/" + d.date.getDay()
}

function getMagFontSize(_s){
	var s = Math.round(_s*2)/2;
	var ss = 16;
		if(s == 9.5) s =  90;
		if(s == 9.0) s =  70;
		if(s == 8.5) s =  60;
		if(s == 8.0) s =  50;
		if(s == 7.5) s =  40;
		if(s == 7.0) s =  30;
		if(s == 6.5) s =  24;
		if(s == 6.0) s =  18;
	return "font-size:" + s + "px"
}

/* ----------------------------------------------------------
SVG_ClockView
---------------------------------------------------------- */
class SVG_ClockView{
	constructor(_view,_r){
		this.view = _view;
		this.v = {}
		var r = _r;
		this.v.hour = this.view.append("circle").attr("class","_bg").attr("r",r)
		this.view.append("circle").attr("r",3).attr("fill","#fff")

		this.v.day = _d3.addT(this.view,"t_day mod-en","0,22","").attr("text-anchor","middle")

		this.v.hourG = this.view.append("g")
		this.v.secG = this.view.append("g")
		this.v.hour = this.v.hourG.append("rect").attr("x",-3).attr("y",-1.5).attr("width",r*0.7).attr("height",3).attr("class","_h")
		this.v.sec = this.v.secG.append("rect").attr("x",-5).attr("width",r*1).attr("height",1).attr("class","_m")
		this.v.hourG.attr("transform","rotate(-90)");
		this.v.secG.attr("transform","rotate(-90)");
		this.view.attr("style","opacity:0")

	}
	update(_d){
		if(this.sd === undefined){this.sd = _d}
		this.ed = _d;
		//
		var h = (1 / 12) *( _d.getHours() + _d.getMinutes()/60)
		this.v.hourG.attr("transform","rotate("+ ( h * 360 -90 )+")");
		var m = (1 / 60) * _d.getMinutes()
		this.v.secG.attr("transform","rotate("+ (m * 360 - 90)+")");
		this.updateDay(_d)
	}
	updateDay(_d){
		var diff = (_d.getTime()-this.sd.getTime() ) / (24 *60 *60* 1000);
		// if(this.cur === undefined) this.cur  = -1;
		// if(this.cur !== _s){
			this.v.day.text("Day "+ (Math.floor(diff)+1) );
		// 	this.cur = _s
		// }
	}
	stageIn(){
		this.view
			.transition().duration(500).attr("style","opacity:1")
	}
	stageOut(){
		this.view
			.transition().duration(500).attr("style","opacity:0")
	}
}

/* ----------------------------------------------------------
SVG_DateView
---------------------------------------------------------- */
class SVG_DateView{
	constructor(_view){
		this.view = _view;
		this.v = {}
		this.v.date = this.view.append("text").attr("class","mod-en")
	}
	update(_d){
		if(this.sd === undefined){this.sd = _d}
		this.ed = _d;
		var s = _d.getFullYear() + "-" +
			_u.fig(_d.getMonth()+ 1) + "-" +
			_u.fig(_d.getDate()) + " " +
			"<tspan>" +
			_u.fig(_d.getHours())+ ":" +
			_u.fig(_d.getMinutes()) + ":" +
			_u.fig(_d.getSeconds()) +
			"</tspan>"
		this.v.date.html(s)
	}
	stageOut(){
		var s = this.sd.getFullYear() + "-" +
			_u.fig(this.sd.getMonth()+ 1) + "-" +
			_u.fig(this.sd.getDate()) + " 〜 " +
			_u.fig(this.ed.getMonth()+ 1) + "-" +
			_u.fig(this.ed.getDate())
		this.v.date.html(s)

	}
}


