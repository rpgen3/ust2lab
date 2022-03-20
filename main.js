(async () => {
    const {importAll, getScript} = await import(`https://rpgen3.github.io/mylib/export/import.mjs`);
    await getScript('https://code.jquery.com/jquery-3.3.1.min.js');
    const {$} = window;
    const html = $('body').empty().css({
        'text-align': 'center',
        padding: '1em',
        'user-select': 'none'
    });
    const head = $('<header>').appendTo(html),
          main = $('<main>').appendTo(html),
          foot = $('<footer>').appendTo(html);
    $('<h1>').appendTo(head).text('ust2lab');
    $('<h2>').appendTo(head).text('歌詞に合わせて口パク用の定義ファイルを作成');
    rpgen3.addA(head, 'https://uo6uo6.hatenablog.com/entry/2021/04/24/160240', 'UTAUの口パクのクオリティを上げたい');
    const rpgen3 = await importAll([
        [
            'input',
            'css',
            'hankaku',
            'util'
        ].map(v => `https://rpgen3.github.io/mylib/export/${v}.mjs`)
    ].flat());
    Promise.all([
        [
            'container',
            'tab',
            'img',
            'btn'
        ].map(v => `https://rpgen3.github.io/spatialFilter/css/${v}.css`)
    ].flat().map(rpgen3.addCSS));
})();
