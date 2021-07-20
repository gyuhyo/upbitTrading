const Fs = FileStream;
const R = Fs.getSdcardPath() + "/ChatBot/module/Room.txt";

var ROOMLIST = Fs.readJson(R).ROOMLIST;

var CoinCode = null;

var LOOPTIME = [
    "minutes/15?market=",
    "minutes/60?market=",
    "minutes/240?market=",
    "days?market=",
    "weeks?market=" ,
];

const LOOPTIMESTRING = ["15분", "1시간", "4시간", "1일", "1주"];
const LOOPMOVING = [5, 10, 20, 60, 120, 200];

var CoinJson = null;

function response(room, msg, sender, isGroupChat, replier, ImageDB, packageName) {
    if (msg.substr(0, 1) == "/" && msg.indexOf("지표") !== -1) {
        if (!ROOMLIST.includes(room)) {
            replier.reply("승인되지 않은 방입니다.");
            return false;
        }

        var InCoins = msg.substring(
            1,
            msg.indexOf(" 지표", 0)
        );

        var krwCheck;
        var koreanCoinName;

        var markets = Utils.getHtmlFromWeb("https://api.upbit.com/v1/market/all");
        markets = JSON.parse(markets);

        for(var i = 0; i < markets.length; i++) {
            koreanCoinName = markets[i].korean_name;

            krwCheck = markets[i].market;

            krwCheck = krwCheck.substring(0, 3);

            if (krwCheck == "KRW" && koreanCoinName.indexOf(InCoins) !== -1) {
                CoinCode = markets[i].market;
                break;
            }
        }

        var CoinMovings = [];
        for (var key in LOOPTIME) {
            var CoinList = Utils.getHtmlFromWeb("https://api.upbit.com/v1/candles/" + LOOPTIME[key] + CoinCode +"&count=200");
            CoinJson = JSON.parse(CoinList);
            CoinMovings[key] = GetMovingAvg(replier);
        }

        var msgs = "[" + koreanCoinName + " 주요지표]\n";
        for (var key in LOOPTIMESTRING) {
            msgs += "\n[" + LOOPTIMESTRING[key] + " 기준]\n";
            msgs += "#     5 이평 : " + CoinMovings[key][0] + "\n";
            msgs += "#   10 이평 : " + CoinMovings[key][1] + "\n";
            msgs += "#   20 이평 : " + CoinMovings[key][2] + "\n";
            msgs += "#   60 이평 : " + CoinMovings[key][3] + "\n";
            msgs += "# 120 이평 : " + CoinMovings[key][4] + "\n";
            msgs += "# 200 이평 : " + CoinMovings[key][5] + "\n";
            msgs += "#       BB上 : " + CoinMovings[key][6] + "\n";
            msgs += "#       BB下 : " + CoinMovings[key][7] + "\n";
            msgs += "#         RSI : " + CoinMovings[key][8] + "\n";
        }

        replier.reply(msgs);
    }
}

function GetMovingAvg(replier) {
    var MovingAvg = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for(var key in LOOPMOVING) {

        if (CoinJson.length < LOOPMOVING[key]-1) {
            MovingAvg[key] = 0;
            continue;
        }

        var sum = 0;
        var avg = 0.00;

        for(var i = LOOPMOVING[key]-1; i>=0; i--) {
            try {
                sum += CoinJson[i].trade_price;
            }catch(e) {

                break;
            }
        }
        avg = sum/LOOPMOVING[key];

        if (LOOPMOVING[key] == 20) {

            var pyun = 0;
            for(var i = 19; i>=0; i--) {
                pyun += Math.pow((CoinJson[i].trade_price - avg), 2);
            }

            pyun = Math.sqrt(pyun / 20);

            var BUp = avg + pyun * 2;
            var BDown = avg - pyun * 2;

            if (BUp >= 100) {
                BUp = BUp.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            } else {
                BUp = parseFloat(numberWithComma(BUp.toFixed(2)));
            }

            if (BDown >= 100) {
                BDown = BDown.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            } else {
                BDown = parseFloat(numberWithComma(BDown.toFixed(2)));
            }

            MovingAvg[6] = BUp;
            MovingAvg[7] = BDown;
        }

        if (avg >= 100) {
            avg = avg.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        } else {
            avg = parseFloat(numberWithComma(avg.toFixed(2)));
        }
        MovingAvg[key] = avg;
    }
    MovingAvg[8] = getRSI();

    return MovingAvg;
}

function numberWithComma(num) {
    var part = (num.toString().includes(".")) ? num.toString().split(".") : part[0] = num;

    return part[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (part[1] ? "." + part[1] : "");
}

function getRSI() {
    var AU = 0;
    var AD = 0;
    var first = true;
    for (var j=CoinJson.length - 15; j>=0; j--) {
        if (first) {
            for (var i = j; i < j + 14; i++) {
                if (CoinJson[i].trade_price > CoinJson[i + 1].trade_price) {
                    AU += (CoinJson[i].trade_price - CoinJson[i + 1].trade_price) / 14;
                } else {
                    AD += (CoinJson[i + 1].trade_price - CoinJson[i].trade_price) / 14;
                }
            }
        } else {
            for (var i = j; i < j + 14; i++) {
                if (CoinJson[i].trade_price > CoinJson[i + 1].trade_price) {
                    AU *= 13 + (CoinJson[i].trade_price - CoinJson[i + 1].trade_price) / 14;
                } else {
                    AD *= 13 + (CoinJson[i + 1].trade_price - CoinJson[i].trade_price) / 14;
                }
            }
        }
    }

    var RS = AU / AD;

    return (100 - (100 / (1 + RS))).toFixed(2);
}