function getObjectDiff(o1, o2) {
  const diffObj = {};

  for (const key in o1) {
    if (o2[key] === undefined) {
      diffObj[key] = o2[key];
      continue;
    }

    if (typeof o1[key] === "object") {
      const res = getObjectDiff(o1[key], o2[key]);
      if (Object.keys(res).length !== 0) {
        diffObj[key] = res;
      }
      continue;
    }

    if (o2[key] !== o1[key]) {
      diffObj[key] = o2[key];
    }
  }

  return diffObj;
}

function object2urls(obj, pathS = "") {
  let urlPath = [];
  for (let key in obj) {
    if (typeof obj[key] === "object") {
      const res = object2urls(obj[key], `${pathS}${key}/`);
      urlPath = urlPath.concat(res);
      continue;
    }
    urlPath.push(pathS + key);
  }
  return urlPath;
}

module.exports = {
  getObjectDiff,
  object2urls
};
