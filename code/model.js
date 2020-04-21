"use strict";
// sName, aName: Sura names 1-114
const sName
=["","Fatiha","Bakara","Ali İmran","Nisa","Maide","Enam","Araf","Enfal",
"Tevbe","Yunus","Hud","Yusuf","Rad","İbrahim","Hicr","Nahl","İsra","Kehf"
,"Meryem","Taha","Enbiya","Hacc","Muminun","Nur","Furkan","Şuara","Neml"
,"Kasas","Ankebut","Rum","Lokman","Secde","Ahzab","Sebe","Fatır","Yasin"
,"Saffat","Sad","Zümer","Mümin","Fussilet","Şura","Zuhruf","Duhan","Casiye"
,"Ahkaf","Muhammed","Fetih","Hucurat","Kaf","Zariyat","Tur","Necm","Kamer"
,"Rahman","Vakıa","Hadid","Mücadele","Haşr","Mümtahine","Saff","Cuma"
,"Münafikun","Tegabun","Talak","Tahrim","Mülk","Kalem","Hakka","Mearic"
,"Nuh","Cinn","Müzzemmil","Müddessir","Kıyamet","İnsan","Mürselat","Nebe"
,"Naziat","Abese","Tekvir","İnfitar","Mutaffifin","İnşikak","Buruc","Tarık"
,"Ala","Gaşiye","Fecr","Beled","Şems","Leyl","Duha","İnşirah","Tin","Alak"
,"Kadir","Beyyine","Zilzal","Adiyat","Karia","Tekasur","Asr","Hümeze","Fil"
,"Kureyş","Maun","Kevser","Kafirun","Nasr","Leheb","İhlas","Felak","Nas"]

const aName 
=  ["","الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام"
,"الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","ابراهيم"
,"الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج"
,"المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت"
,"الروم","لقمان","السجدة","الأحزاب","سبإ","فاطر","يس","الصافات","ص"
,"الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف"
,"محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر"
,"الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف"
,"الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم"
,"الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الانسان"
,"المرسلات","النبإ","النازعات","عبس","التكوير","الإنفطار","المطففين"
,"الإنشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس"
,"الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة"
,"العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش"
,"الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"]

/** Reads a text file -- Quran translation
 *  one line for each verse that begins with "c|v|"
 */
class KuranText {
    constructor(url, callback) {
      //cannot use function because of "this"
      let process = (tt) => {
        // console.log(tt.length, url) // => 874956
        let a = ('\n'+tt).replace(/\|/g, '. ').split(/\n\d+\. /)
        //trim the credits at the end
        a[6236] = a[6236].split(/\n/)[0]
        this.data = a; this.loaded = true
        if (callback) callback(a)
      }
        this.url = url; this.data = []
        fetch_text_then(url, process)
    }
    chapName(c) { return '('+c+') '+sName[c]+' Suresi' }
    get besmele() { return 'Bismillahirrahmanirrahim' }
    verseToHTML(id, s) {
      return '<span id='+id+'>'+s+'</span><BR>'
    }
    pageToHTML(p) {
      let newChapter = () => {
        // let br = i==index[p]+1? '' : '<BR>'; //semicolon required
        [c, v] = toCV(i)
        out.push('<div class=divider>'+this.chapName(c)+'</div>')
        if (c!=1 && c!=9)
          out.push('<div class=besmele>'+this.besmele+'</div>')
      }
        let i = index[p]+1 //first verse on page
        let k = index[p+1] //last verse on page
        let [c, v] = toCV(i), out = []
        while (i <= k) { //for each verse x
          let s = this.getVerse(i)
          if (s.startsWith('1.')) newChapter()
          let id = '_'+c+'_'+v
          out.push(this.verseToHTML(id, s))
          i++; v++
        }
        return out.join('\n')
    }
    getVerse(i) { return this.data[i] }
    toString() { return url }
}
/** Reads original Quran in Arabic */
class QuranText extends KuranText {
    constructor(url, callback) { super(url, callback) }
    /** we override three methods */
    chapName(c) { return ' سورة '+aName[c] }
    get besmele() { return 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' }
    verseToHTML(id, s) {
      let [n,...a] = s.split(/\.? /)  //divide into words
      // a.length-- //skip last char '\n'
      s = a.map(w => '<span>'+w+'</span>').join(' ')
        + ' ﴿'+numberToArabic(n)+'﴾ '
      return '<span id='+id+'>'+s+'</span>' //no <BR>
    }
}

// export {sName, aName, KuranText, QuranText}