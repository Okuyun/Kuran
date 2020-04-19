"use strict";
// idea by A Rajab https://a0m0rajab.github.io/LearningQuest/googleDocs/submitForm.html
// https://www.freecodecamp.org/news/cjn-google-sheets-as-json-endpoint/
// https://bionicteaching.com/silent-submission-of-google-forms/

const FORM_URL = "https://docs.google.com/forms/d/e/"
    +"1FAIpQLScdPCvf2w1Mt54JpTw8W893H82jJn8szLhRa0lpg3AS-sVOow/"
const DOCS_URL = "https://docs.google.com/spreadsheets/u/1/d/e/"
    +"2PACX-1vSp1W2iSr6FGHd6aNRbFIOnFSYqZOYoCTAejwEGz_Ul8Ibfjb3moyInjY_H8243fneNwOSWDHoUMgRn/"

function submitData(user, topic, marks) { //to Google Forms -- add one line
    //magic numbers in the link are from "Get pre-filled link" menu
    const link = FORM_URL+"formResponse?usp=pp_url"
        +"&entry.1886222="+user
        +"&entry.1060034848="+topic
        +"&entry.2142667267="+marks
        +"&submit=Submit"
    const post = document.createElement("iframe")
    post.src = decodeURI(link)
    post.id = "postID"
    post.hidden = true;
    document.body.appendChild(post)
    const removeElement = () => {post.parentNode.removeChild(post)}
    setTimeout(removeElement, 2000);
}
// Try various ways to read from Google Sheets -- show all data
const URL = DOCS_URL+'pub?output=tsv' //tab-separated values
function fetchData(success, failure) { //simplest method
    fetch(URL)
      .then(r => r.text()) 
      .then(success).catch(failure)
}
function readTabularData(success) { //uses fetch -- external
    const B = {time:0, user:0, topic:0, marks:0}
    const bm = new TabularData(B, 'bookmarks') //external class
    bm.readData(URL, t => {success(t, bm.data)})
}
function readLinkData(success, failure) { //complicated XML
    const xmlhttp = new XMLHttpRequest()
    xmlhttp.open('GET', URL, true);
    xmlhttp.onreadystatechange = () => {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
             success(xmlhttp.responseText)
        else failure(xmlhttp)
    }
    xmlhttp.send(null)
}

class TabularData {
    constructor(sample, name='TabularData') {
      this.name = name
      this.proto = Object.getPrototypeOf(sample)
      this.keys = Object.getOwnPropertyNames(sample)
      console.log(this.name, this)
      this.data = []
    }
    readData(url, callback) {
      let k = this.keys
      let toArray = (t) => {
        for (let s of t.split('\n')) {
          if (!s) break //end of loop 
          let b = s.split('\t'); //TAB
          let n = Math.min(k.length, b.length)
          let x = {}
          for (let i=0; i<n; i++)
              x[k[i]] = b[i]
          if (n < b.length) { //remainder
            let r = []
            for (let i=n-1; i<b.length; i++) 
                r.push(b[i])
            x[k[n-1]] = r  //last key
          }
          Object.setPrototypeOf(x, this.proto)
          this.data.push(x)
        }
        if (callback) callback(t)
      }
      fetch(url).then(x => x.text()).then(toArray)
    }
    toString() {
      return this.keys.join(', ')
    }
  }

// export {readTabularData, submitData}