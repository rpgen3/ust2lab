(async () => {
    const {importAll, getScript} = await import(`https://rpgen3.github.io/mylib/export/import.mjs`);
    await Promise.all([
        'https://code.jquery.com/jquery-3.3.1.min.js',
        'https://kazuhikoarase.github.io/jaconv/dist/jaconv.mjs',
        'https://cdnjs.cloudflare.com/ajax/libs/encoding-japanese/1.0.29/encoding.min.js'
    ].map(getScript));
    const {$, jaconv, Encoding} = window;
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const head = $('<header>').appendTo(html),
          main = $('<main>').appendTo(html),
          foot = $('<footer>').appendTo(html);
    $('<h1>').appendTo(head).text('ust2lab');
    $('<h2>').appendTo(head).text('歌詞に合わせたリップシンク用の定義ファイルを作成');
    const rpgen3 = await importAll([
        [
            'input',
            'css',
            'util'
        ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`)
    ].flat());
    rpgen3.addA(head, 'https://uo6uo6.hatenablog.com/entry/2021/04/24/160240', 'UTAUの口パクのクオリティを上げたい');
    $('<h2>').appendTo(head).text('改善その2を実装済み');
    Promise.all([
        [
            'container',
            'tab',
            'img',
            'btn'
        ].map(v => `https://rpgen3.github.io/spatialFilter/css/${v}.css`)
    ].flat().map(rpgen3.addCSS));
    const hideTime = 500;
    const addHideArea = (label, parentNode = main) => {
        const html = $('<div>').addClass('container').appendTo(parentNode);
        const input = rpgen3.addInputBool(html, {
            label,
            save: true,
            value: true
        });
        const area = $('<dl>').appendTo(html);
        input.elm.on('change', () => input() ? area.show(hideTime) : area.hide(hideTime)).trigger('change');
        return Object.assign(input, {
            get html(){
                return area;
            }
        });
    };
    {
        const {html} = addHideArea('input UST file');
        $('<dt>').appendTo(html).text('USTファイル');
        let ust = '',
            fileName = '';
        $('<input>').appendTo($('<dd>').appendTo(html)).prop({
            type: 'file',
            accept: '.ust'
        }).on('change', async ({target}) => {
            const {files} = target;
            if(!files.length) return;
            const file = files[0];
            fileName = file.name.replace('.ust', '');
            const a = new Uint8Array(await file.arrayBuffer());
            ust = Encoding.convert(a, {
                to: 'unicode',
                from: Encoding.detect(a),
                type: 'string'
            });
        });
        const mode = rpgen3.addSelect(html, {
            label: '処理',
            save: true,
            list: {
                '母音だけ': 0,
                '子音→母音': 1,
                '前後の音素を参照': 2
            }
        });
        const delay = rpgen3.addSelect(html, {
            label: '子音発音時間',
            save: true,
            list: [
                1E4,
                1E5,
                1E6
            ],
            value: 1E5
        });
        $('<dd>').appendTo(html);
        rpgen3.addBtn(html, 'LABファイル作成', () => {
            rpgen3.download(makeLAB(ust, mode(), delay()), `${fileName} - ust2lab.lab`);
        }).addClass('btn');
    }
    const makeLAB = (ust, mode, delay) => {
        let Tempo = 0,
            Length = 0,
            Lyric = 'R',
            now = 0,
            output = [];
        const check = time => {
            if(time === 0) return '00000';
            else return Math.round(time);
        };
        const push = (now, time, value) => output.push([...[now, now + time].map(check), value === 'n' ? 'N' : value]);
        for(const s of ust.split(/[\n\r]+/)) {
            if(s[0] === '[') {
                if((s !== '[#0000]' && /^\[#[0-9]+\]$/.test(s)) || s === '[#TRACKEND]') {
                    const time = 125E4 / Tempo * Length;
                    if(Lyric === 'R') push(now, time, 'sil');
                    else {
                        const r = choiceVowel(Lyric, mode);
                        if(Array.isArray(r)) {
                            push(now, delay, r[0]);
                            push(now + delay, time, r[1]);
                        }
                        else push(now, time, r);
                    }
                    now += time;
                }
            }
            else {
                const ar = s.split('=');
                if(ar.length !== 2) continue;
                const [attr, value] = ar;
                switch(attr){
                    case 'Tempo':
                        Tempo = Number(value);
                        break;
                    case 'Length':
                        Length = Number(value);
                        break;
                    case 'Lyric':
                        Lyric = value.split(' ').slice(-1)[0];
                        break;
                }
            }
        }
        // 終了時刻の補正
        for (let i = 0; i < output.length; i++) {
            if (i === 0) continue;
            const now = output[output.length - 1 - i ];
            const next = output[output.length - i];
            if (Number(now[1]) > Number(next[0])) {
                now[1] = next[0];
            }
        }
        return URL.createObjectURL(new Blob([output.map(v=>v.join(' ')).join('\r\n')], {type: 'text/plain'}));
    };
    const choiceVowel = (() => {
        const toE = new Set('s|sh|z|t|ts|ch|d|j|n|ny|r|ry'.split('|')),
              toN = new Set('m|b|p|my|by|py'.split('|')),
              toU = new Set(['w']);
        return (Lyric, mode) => {
            const s = jaconv.toHebon(Lyric).toLowerCase();
            if(!s) throw `Invalid Lyric=${Lyric}`;
            const vowel = s.slice(-1);
            let c = s.slice(0, -1);
            switch(mode){
                case 0: return vowel;
                case 1: {
                    if(!c) return vowel;
                    else if(toE.has(c)) c ='e';
                    else if(toN.has(c)) c ='n';
                    else if(toU.has(c)) c ='u';
                    return [c, vowel];
                }
                case 2:
                    break;
            }
        };
    })();
})();
