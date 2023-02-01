$(function() {


    
    let allBrands=[];
   
    let checkBrands=[];//チェックされたヤツを入れる配列用
    
    let timerId;//タイマー削除用
    
    let activeChart=[];//表示するチャートのデータを入れる
    
    
    
    let chartData={
        datasets:activeChart
    };
    
    let config={
        type:'line',
        
        data:chartData,
        
        responsive:true,
        
        options:{
            
            legend: {
                position: 'bottom' // 凡例を下に表示
            },
            
            scales: {
                xAxes: [{
                    type: 'realtime',
                    
                    realtime: {
                        delay: 4000, // 遅延時間(4秒)
                        duration: 20000, // グラフに表示する期間(20秒)
                        refresh: 1000, // 再描画間隔(1秒)
                    }
                }]
            },

            tooltips: {
                mode: 'index', // nearest: マウスポインタに近いデータを表示, index: 同一インデックス(ここでは時刻)のデータを表示
                intersect: false,
                callbacks: {
                    // CPU 使用率のデータを小数点以下 2 桁で四捨五入    前に「$」を付けて表示する
                    label: (tooltipItem, data) => {
                        let label = data.datasets[tooltipItem.datasetIndex].label || '';

                        if (label) {
                            label += ': ';
                        }

                        label += Math.round(tooltipItem.yLabel * 100) / 100;

                        return '$ '+label;
                    }
                }
            },
        },
    };
    
    let ctx=$('#canvas');
    let chart=new Chart(ctx,config);
    
    
    /*1        銘柄の一覧呼び出し*/
        $.ajax({
            url: 'https://development-primer.com/js-api/api/stocks',
            dataType: 'json',
            async: false,
            
        }).done((res) => {
            // リクエストが成功したときの処理//モーダルにresの中身を表示する。
            res.forEach(function(element,index){
                $('#index').append(`<p><label><input type="checkbox" id="${index}" name="brand" value="${element.code}">${element.name}</lable></p>`);
            });
        }).fail(() => {
            console.log('エラーです');
        });
        
    
        
    /*2    モーダル*/
        const active_modal=()=>{
            $('.show').modaal({
                start_open:true,
                before_open:()=>{
                    //チェックを付ける
                    for(let i=0;i<allBrands.length;i++){
                        for(let j=0;j<checkBrands.length;j++){
                            if(allBrands[i].value===checkBrands[j].code){
                                allBrands[i].checked = true;
                            }
                        }
                    }
                }
            });
        }
        
        
        
        //銘柄選択が押されたらモーダル上のボタンが押せるようになる
        $('.show').on('click',()=>{
            active_modal();
            $('#btn').prop('disabled', false);
        });
        
        
        //チャート表示ボタンが呼ばれたら
        $('#btn').on('click',()=>{
            
            deleteArray();
            
            start_chart();
            
            //ボタンオフ
            $('#btn').prop('disabled', true);
            
            //モーダルを閉じたい 
            $('.show').modaal('close');
            
            // グラフ表示を再開
            config.options.pause = false; 
            
            save();
        });
        
        const start_chart=()=>{//いろいろ
              
            
            // グラフ表示を一時停止
            config.options.pause = true;                             
            
            //タイマー削除
            clearTimeout(timerId);
            
            //チャート表示処理
            
            chartJs();
            update();
            chart.update();
        }
        
        
        
        
    //チェック付きの銘柄を入れる配列初期化
    function deleteArray(){
        checkBrands.splice(0, checkBrands.length);
        activeChart.splice(0, activeChart.length);                  // checkBrandsの要素数ではなく、自身の要素数を指定すべき
    } 
    
    
    
//チャート表示準備1

    function chartJs(){
        //#index内をchecked=trueか判定し、trueならcheckBrands.push(obj.value);
            $('#index input:checked').each((index,element) => {
                checkBrands.push({
                    code: element.value,
                    name: element.parentNode.innerText,
                });
            });
            
            activeChart.length = 0;
            checkBrands.forEach(element => {
                const getCode = () => Math.floor(Math.random() * 256);
                const colorCode = `rgb(${getCode()},${getCode()},${getCode()})`;
                activeChart.push({
                    label: element.name,
                    backgroundColor: colorCode,
                    borderColor: colorCode,
                    fill: false,
                    data: []
                });
            });
    }
    
    
    //株価を引っ張る    描画呼び出し    
        const update = () => {
            if (checkBrands.length === 0) return;
            
        
            $.ajax({
                url: 'https://development-primer.com/js-api/api/stocks/prices/' + checkBrands.map(element => element.code).join(','),
                dataType: 'json'
            }).done((res) => {
                    //ここでチェックを付けた銘柄の株価と時間を配列に入れる
                    chart.data.datasets.forEach((dataset, index) => {
                        dataset.data.push({
                            x: res[index].timestamp,
                            y: res[index].price
                        });
                    });
                    chart.update();
                    
            }).fail(() => {
                console.log('エラーです');
            });
            timerId = setTimeout(update, 2000);
        };
        
    
        
        /*保存*/
        const save = () => {
                if (checkBrands.length > 0) {
                    localStorage.setItem('canvas', JSON.stringify(checkBrands));//checkBrandsをjson形式で保存する
                    console.log('セーブした');
                } else {
                    localStorage.removeItem('canvas');//削除
                    console.log('削除した');
                }
                
            }
            
        
        //起動時
        $(function(){
            let jsonText=localStorage.getItem('canvas');
            
             //全銘柄のHTML要素を取る
            $('#index>p>label>input').each((index,element) => {
                allBrands.push(element);
            });
 
            if(jsonText!==null)
            {
                //復元
                let array=JSON.parse(jsonText);
                array.forEach((element,index)=>{
                    checkBrands.push(element);
                });
                
                //チャート表示
                start_chart();
                
            }else{//前回何も選択していなければ
                active_modal();
            }
        });    
});
