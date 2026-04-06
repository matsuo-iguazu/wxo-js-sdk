/**
 * HTTP client for watsonx Orchestrate API communication
 * Uses IBM custom headers for authentication (no Bearer token required)
 */
class HttpClient {
  constructor(config) {
    this.config = config;
    this.baseURL = config.get('hostURL');
    this.baseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    };
    this.ibmHeaders = {};
  }

  /**
   * Set IBM authentication headers
   * @param {string} userId - Anonymous user ID (e.g. "anonymous-{uuid}")
   */
  setIBMHeaders(userId) {
    this.ibmHeaders = {
      'x-ibm-wo-orchestrate-id': this.config.get('orchestrationID'),
      'x-ibm-wo-user-id': userId
    };
    const crn = this.config.get('crn');
    if (crn) {
      this.ibmHeaders['x-ibm-wo-crn'] = crn;
    }
  }

  /**
   * Get all current headers (base + IBM)
   * @returns {Object}
   */
  getHeaders(extra = {}) {
    return { ...this.baseHeaders, ...this.ibmHeaders, ...extra };
  }

  /**
   * Build full URL from path
   * @private
   */
  _buildURL(path) {
    const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  /**
   * Make HTTP request
   * @private
   */
  async _request(method, path, options = {}) {
    const url = this._buildURL(path);
    const { body, headers = {}, ...rest } = options;

    const requestConfig = {
      method,
      headers: this.getHeaders(headers),
      ...rest
    };

    if (body !== undefined) {
      requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    if (this.config.isDebug()) {
      console.log(`[wxo-sdk] ${method} ${url}`, requestConfig);
    }

    const response = await fetch(url, requestConfig);

    const contentType = response.headers.get('content-type') || '';
    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(
        (data && data.message) || `HTTP ${response.status}: ${response.statusText}`
      );
      error.status = response.status;
      error.response = data;
      throw error;
    }

    if (this.config.isDebug()) {
      console.log(`[wxo-sdk] Response:`, data);
    }

    return data;
  }

  /**
   * Make a streaming POST request, yielding SSE/chunk lines
   * @param {string} path
   * @param {Object} body
   * @param {Object} options
   * @returns {Response} raw fetch Response for stream reading
   */
  async stream(path, body, options = {}) {
    const url = this._buildURL(path);
    const { headers = {} } = options;

    const requestConfig = {
      method: 'POST',
      headers: this.getHeaders(headers),
      body: JSON.stringify(body)
    };

    if (this.config.isDebug()) {
      console.log(`[wxo-sdk] STREAM POST ${url}`, requestConfig);
    }

    const response = await fetch(url, requestConfig);

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = text;
      throw error;
    }

    return response;
  }

  async get(path, options = {}) {
    return this._request('GET', path, options);
  }

  async post(path, body, options = {}) {
    return this._request('POST', path, { ...options, body });
  }

  async patch(path, body, options = {}) {
    return this._request('PATCH', path, { ...options, body });
  }

  async delete(path, options = {}) {
    return this._request('DELETE', path, options);
  }
}

export default HttpClient;

// Made with Bob
