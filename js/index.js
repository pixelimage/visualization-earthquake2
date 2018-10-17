/* ----------------------------------------------------------
setting
---------------------------------------------------------- */

var width = 500;
var height = 500;

var speed = 1000 * 365.25 * 2;
var title = "大規模地震の比較 <tspan>(発生当日の0時から一ヶ月間の経過)</tspan>"
//(24/24);

var presetList = {
"kumamoto": {
  label: "熊本地震",
  notes: "●M : M7.3<br>●最大震度 : 7<br>●死者数 : 269人<br>●行方不明者数 : 0人<br>●負傷者数 : 2,806人",
  // startDate : new Date("2016/04/14 20:26:00"),
  startDate: new Date("2016/04/14"),
  // endDate : new Date("2016/04/17"),
  endDate: new Date("2016/05/14"),
  speed: speed,
  file: "data/kumamoto.tsv"
},
  "higashi": {
    label: "東日本大震災",
    notes: "●M : M9<br>●最大震度 7<br>●死者数 : 19,630人<br>●行方不明者数 : 2,569人<br>●負傷者数 : 6,230人",
    // startDate : new Date("2011/03/11 13:46:00"),
    startDate: new Date("2011/03/11"),
    // endDate : new Date("2011/03/14"),
    endDate: new Date("2011/04/11"),
    speed: speed,
    file: "data/higashi.tsv"
  },
  "hanshin": {
    label: "阪神・淡路大震災",
    notes: "●M : M7.3<br>●最大震度 : 7<br>●死者数 : 6,434人<br>●行方不明者数 : 3人<br>●負傷者数 : 43,792人",
    // startDate : new Date("1995/01/17 4:46:00"),
    startDate: new Date("1995/01/17"),
    // endDate : new Date("1995/01/20"),
    endDate: new Date("1995/02/17"),
    speed: speed,
    file: "data/hanshin.tsv"
  },
  "kantou": {
    label: "関東大震災",
    notes: "●M : M7.9<br>●最大震度 : 6<br>●死者数 : 105,000人程度",
    // startDate : new Date("1923/9/01 10:58:00"),
    startDate: new Date("1923/9/01"),
    // endDate : new Date("1923/09/04"),
    endDate: new Date("1923/10/01"),
    speed: speed,
    file: "data/kantou.tsv"
  }
}
// var query = _.assignIn({epic:"all"} ,_u.getQuery());
// var setting = presetList[query["epic"]];


/* ----------------------------------------------------------
prepare
---------------------------------------------------------- */

var svg = d3.select("svg")
var gs = {}

gs.stage = _d3.addG(svg, "", "0,35");

//テキスト
gs.header = _d3.addG(svg, "", "")
_d3.addR(gs.header, "title_bg", "0,0,100%,35")
_d3.addT(gs.header, "t_title", "20,25", title)
// _d3.addT(gs.header,"t_title","20,25",setting.title)
// _d3.addT(gs.header,"t_title2","20,125",setting.title2 )

//ノート
gs.notes = _d3.addG(svg, "", "20,460")
_d3.addT(gs.notes, "t_note", "0,0", "※発生する丸い赤枠(黄色い塗)は、Mの大きさを表しいます")
// _d3.addT(gs.notes,"t_note","0,15","※地震が引き起こした最大震度を、震源地にプロットします。")
// _d3.addT(gs.notes,"t_note","0,30","※気象庁の統計データを利用。震度4以上の地震のみプロットします。")
_d3.addT(gs.notes, "t_note", "0,15", "※気象庁の統計データを利用。M4以上の地震のみプロットします。")


/* ----------------------------------------------------------
lo_d3.addata
---------------------------------------------------------- */

var mapStages = [
  new Map(svg, _d3.addG(gs.stage, "", "0,0"), presetList["hanshin"], "249,200", "-30,-240"),
  new Map(svg, _d3.addG(gs.stage, "", "250,0"), presetList["higashi"], "250,200", "-180,-180"),
  new Map(svg, _d3.addG(gs.stage, "", "0,201"), presetList["kumamoto"], "249,200", "0,-320"),
  new Map(svg, _d3.addG(gs.stage, "", "250,201"), presetList["kantou"], "250,200", "-120,-240")
]

var count = 0;
var loadedDatas = [null, null, null, null]

function loadData(_s, _n) {
  d3.tsv(_s).then(function(_datas) {
    count++;
    loadedDatas[_n] = _datas;
    if (count == 4) {
      loadedData()
    }
  });
}
loadData(presetList.hanshin.file, 0)
loadData(presetList.higashi.file, 1)
loadData(presetList.kumamoto.file, 2)
loadData(presetList.kantou.file, 3)

function loadedData(_datas) {
  for (var i = 0; i < loadedDatas.length; i++) {
    loadedDatas[i] = treatData(loadedDatas[i])
  }
  //
  mapStages[0].setData(loadedDatas[0])
  mapStages[1].setData(loadedDatas[1])
  mapStages[2].setData(loadedDatas[2])
  mapStages[3].setData(loadedDatas[3])
  // mapStages[3].stageInit()
  // mapStages[0].stageInit()
  // mapStages[1].stageInit()
  // mapStages[2].stageInit()
  // mapStages[0].stageIn()
  // mapStages[1].stageIn()
  // mapStages[2].stageIn()
  // mapStages[3].stageIn()
  // return
  //
  	new _u.serial_([
  		function () { }
  		,0.5, function () {mapStages[3].stageInit()}
  		,0.5, function () {mapStages[0].stageInit()}
  		,0.5, function () {mapStages[1].stageInit()}
  		,0.5, function () {mapStages[2].stageInit()}
  		,1.5, function () {
  			mapStages[0].stageIn()
  			mapStages[1].stageIn()
  			mapStages[2].stageIn()
  			mapStages[3].stageIn()
  		}
  	]).start();
};


function treatData(_datas) {
  var datas = []
  for (var i = 0; i < _datas.length; i++) {
    var b = true;
    if (_datas[i].latitude == "不明") b = false;
    if (_datas[i].longitude == "不明") b = false;
    if (_datas[i].mag == "不明") b = false;
    _datas[i].date = _datas[i].date.split(".")[0]
    _datas[i].date = new Date(_datas[i].date);
    if (b) {
      var int = _datas[i].intensity = treatIntensity(_datas[i].intensity)
      _datas[i].mag = _datas[i].mag.split("M").join("")
      _datas[i].mag = _datas[i].mag.split("Ｍ").join("")
      datas.push(_datas[i]);
    }
  }
  return datas;
}