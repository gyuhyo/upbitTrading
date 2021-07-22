let socket = new WebSocket("wss://api.upbit.com/websocket/v1");
socket.binaryType = 'arraybuffer';
var coin = ["KRW-BTC", "KRW-ETH", "KRW-XRP", "KRW-DOGE"];
let postdata =  JSON.stringify([{"ticket":"test1243563456"},{"type":"ticker","codes":coin}]);


socket.onopen = ((e) => {
    socket.send(postdata);
});

socket.onclose = (() => {
});

socket.onmessage = ((data) => {
    let enc = new TextDecoder("utf-8");
    let arr = new Uint8Array(data.data);
    let arrToJson = JSON.parse(enc.decode(arr));

    let datas = {
        "markets": arrToJson.code, // 마켓
        "trade": numberWithComma(arrToJson.trade_price), // 현재가
        "signed_change_price": numberWithComma(arrToJson.signed_change_price), // 전일대비
        "change_price": arrToJson.change_price, // 부호없는 전일 대비
        "signed_change_rate": (arrToJson.signed_change_rate * 100).toFixed(2), // 등락률
        "acc_trade_price": numberWithComma((arrToJson.acc_trade_price / 1000000).toFixed(0)), // 거래량
        "ask_bid": arrToJson.ask_bid
    }

    viewTradeTicker(datas);
});

socket.onerror = ((e) => {
    console.log(e);
});

let viewTradeTicker = (datas) => {
    if ($("#" + datas.markets + "-CARD").find(".trade_price").text() != (datas.trade + " (" + datas.signed_change_rate + "%)").toString()) {
        if (datas.ask_bid == "ASK") {
            $("#" + datas.markets + "-CARD").find(".card").animate({"background-color": "#41AF39"}, 500);
        } else {
            $("#" + datas.markets + "-CARD").find(".card").animate({"background-color": "#EB539E"}, 500);
        }
    }

    $("#" + datas.markets + "-CARD").find(".trade_price").text(datas.trade + " (" + datas.signed_change_rate + "%)");
    let scp = (Number(datas.change_price) < 1000) ? datas.signed_change_price + ".00" : datas.signed_change_price;
    $("#" + datas.markets + "-CARD").find(".closing_trade").text("전일대비 " + scp);
    $("#" + datas.markets + "-CARD").find(".price_volume").text(datas.acc_trade_price + "백만");
}

let numberWithComma = (n) => {
    var parts = n.toString().split(".");

    return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (parts[1] ? "." + parts[1] : "");
}

let numberToKorean = (number) => {
    var inputNumber  = number < 0 ? false : number;
    var unitWords    = ['', '만', '억', '조', '경'];
    var splitUnit    = 10000;
    var splitCount   = unitWords.length;
    var resultArray  = [];
    var resultString = '';

    for (var i = 0; i < splitCount; i++){
        var unitResult = (inputNumber % Math.pow(splitUnit, i + 1)) / Math.pow(splitUnit, i);
        unitResult = Math.floor(unitResult);
        if (unitResult > 0){
            resultArray[i] = unitResult;
        }
    }

    for (var i = 0; i < resultArray.length; i++){
        if(!resultArray[i]) continue;
        resultString = String(resultArray[i]) + unitWords[i] + resultString;
    }

    return resultString;
}
