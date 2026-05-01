fetch("http://localhost:3000/api/bills")
  .then(res => {
    console.log("Status:", res.status);
    return res.text();
  })
  .then(text => console.log("Body:", text.substring(0, 50)))
  .catch(err => console.error(err));
