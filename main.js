const service_address = 'https://my.pureheart.org/ministryplatformapi';
const authorize_url = 'https://my.pureheart.org/ministryplatformapi/oauth/connect/authorize';
const client_id = 'dev_testing';
const redirect_uri = 'http://127.0.0.1:5500/callback.html';
const response_type = 'token';
const scope = 'http://www.thinkministry.com/dataplatform/scopes/all';

const Cookie = {
  setCookie: function (name, value, seconds) {
    let expires = "";
    if (seconds) {
        const date = new Date();
        date.setTime(date.getTime() + (seconds * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    // document.cookie = name + "=" + (value || "") + expires + "; path=/; Secure; HttpOnly";
    document.cookie = name + "=" + (value || "") + expires + "; path=/;";
    console.log('cookie set')
  },
  getCookie: function (name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
  },
  deleteCookie: function (name) {
    document.cookie = name + '=; Max-Age=0'
  }
}

const User = {
  login: function () {
    window.location.href = '/login.html'
  },
  logout: function () {
    Cookie.deleteCookie('access_token');
    Cookie.deleteCookie('token_type');
    window.location.reload();
  },
  authorize: function (authorize_url, client_id, redirect_uri, response_type, scope) {
    const params = {
      client_id: client_id,
      redirect_uri: redirect_uri,
      response_type: response_type,
      scope: scope
    }
    const url = new URL(authorize_url);
    url.search = new URLSearchParams(params);
    window.location.replace(url.href);
  }
}

const ErrorModal = {
  show: function (title, description) {
    const errorContainerDOM = document.querySelector('dialog#error-container');
    if (errorContainerDOM) {
      errorContainerDOM.querySelector('h1.error-title').textContent = title;
      errorContainerDOM.querySelector('p.error-description').textContent = description;
      errorContainerDOM.showModal();
      return;
    }
  
    const errorContainer = document.createElement('dialog');
    errorContainer.id = 'error-container';
    errorContainer.innerHTML = `
      <div class="header">
        <h1 class="error-title">${title}</h1>
        <button class="error-close" onclick="ErrorModal.close()"><i class="material-icons">close</i></button>
      </div>
      <p class="error-description">${description}</p>
    `;
    document.body.appendChild(errorContainer);
    errorContainer.showModal();
  },
  close: function () {
    const errorContainerDOM = document.querySelector('dialog#error-container');
    errorContainerDOM.close();
  }
}

const MinistryPlatformAPI = {
  handleCallback: function () {
    const queryString = window.location.href.split('#')[1];
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.get('error')) {
      ErrorModal.show(urlParams.get('error'), urlParams.get('error_description'));
    } else if (urlParams.get('access_token')) {
      const expiresInMilliseconds = parseInt(urlParams.get('expires_in'));
      Cookie.setCookie('access_token', urlParams.get('access_token'), expiresInMilliseconds);
      Cookie.setCookie('token_type', urlParams.get('token_type'), expiresInMilliseconds);
      
      window.location.replace('/index.html');
    }
  },
  getAuthentication: function () {
    const accessToken = Cookie.getCookie("access_token");
    const tokenType = Cookie.getCookie("token_type");
    return !accessToken || !tokenType ? null : `${Cookie.getCookie('token_type')} ${Cookie.getCookie('access_token')}`;
  },
  request: async function (method, path, query, body) {
    return await axios({
      method: method,
      url: service_address + path,
      headers: {
        'Authorization': this.getAuthentication(), 
        'Content-Type': 'application/json'
      },
      params: query,
      data: body
    })
      .then(response => response.data)
      .catch((error) => ErrorModal.show("Failed to make request", JSON.stringify(error.response.data)));
  }
}