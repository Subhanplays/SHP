import axios from 'axios';

class PterodactylService {
  constructor() {
    this.timeout = 30000;
  }

  // Normalize a panel URL: trim, ensure protocol, strip trailing slashes
  normalizeUrl(panelUrl) {
    if (!panelUrl) return '';
    let url = String(panelUrl).trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    return url.replace(/\/+$/, '');
  }

  // Test connection to Pterodactyl panel
  async testConnection(panelUrl, apiKey) {
    const url = this.normalizeUrl(panelUrl);
    if (!url) return { success: false, error: 'Panel URL is required' };
    if (!apiKey) return { success: false, error: 'Application API Key is required' };

    const testPath = '/api/application/users?per_page=1';
    try {
      const response = await axios.get(`${url}${testPath}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'Application/vnd.pterodactyl.v1+json',
        },
        timeout: this.timeout,
      });
      return { success: true, status: response.status };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        return { success: false, error: `Connection refused. Check the URL (${url}) is correct and the panel is running.` };
      }
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        return { success: false, error: `Host not found: ${url}. Check the domain is correct.` };
      }
      if (error.code === 'ECONNABORTED') {
        return { success: false, error: `Request timed out. Check that ${url} is reachable and HTTPS is correct.` };
      }
      if (error.response?.status === 404) {
        return { success: false, error: `Panel returned 404 on ${url}${testPath}. This URL does not look like a Pterodactyl panel — check it (e.g. https://panel.yourdomain.com, no trailing path).` };
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        return { success: false, error: 'Authentication failed. Check your Application API Key.' };
      }
      if (error.response?.status) {
        return { success: false, error: `Panel responded with HTTP ${error.response.status}. Check the URL ${url} is correct.` };
      }
      return { success: false, error: error.message };
    }
  }

  // Create a new user on Pterodactyl
  async createUser(panelUrl, apiKey, userData) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const response = await axios.post(
        `${url}/api/application/users`,
        {
          email: userData.email,
          username: userData.username,
          first_name: userData.firstName || 'SHP',
          last_name: userData.lastName || 'User',
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'Application/vnd.pterodactyl.v1+json',
          },
        }
      );
      return response.data?.attributes || response.data?.data?.attributes || response.data?.data || response.data;
    } catch (error) {
      throw new Error(`Failed to create Pterodactyl user: ${error.response?.data?.errors?.[0]?.code || error.message}`);
    }
  }

  // Get user by email
  async getUserByEmail(panelUrl, apiKey, email) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const response = await axios.get(`${url}/api/application/users`, {
        params: { 'filter[email]': email },
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'Application/vnd.pterodactyl.v1+json',
        },
      });
      const list = response.data?.data || [];
      return list?.[0] || null;
    } catch (error) {
      if (error.response?.status === 404) return null;
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Create a new server
  async createServer(panelUrl, apiKey, serverData) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const response = await axios.post(
        `${url}/api/application/servers`,
        {
          name: serverData.name,
          user: serverData.userId,
          nest: serverData.nestId,
          egg: serverData.eggId,
          docker_image: serverData.dockerImage,
          startup: serverData.startup,
          environment: serverData.environment,
          limits: {
            memory: serverData.memory,
            swap: serverData.swap || 0,
            disk: serverData.disk,
            io: serverData.io || 500,
            cpu: serverData.cpu,
          },
          feature_limits: {
            databases: serverData.databases || 0,
            allocations: serverData.allocations || 1,
            backups: serverData.backups || 0,
          },
          allocation: {
            default: Number(serverData.allocationId),
            additional: serverData.additionalAllocationIds || [],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'Application/vnd.pterodactyl.v1+json',
          },
        }
      );
      return response.data?.attributes || response.data?.data?.attributes || response.data?.data || response.data;
    } catch (error) {
      throw new Error(`Failed to create server: ${JSON.stringify(error.response?.data) || error.message}`);
    }
  }

  // Get server details
  async getServerInfo(panelUrl, apiKey, serverId) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const response = await axios.get(
        `${url}/api/application/servers/${serverId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'Application/vnd.pterodactyl.v1+json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get server info: ${error.message}`);
    }
  }

  // Delete a server
  async deleteServer(panelUrl, apiKey, serverId) {
    const url = this.normalizeUrl(panelUrl);
    try {
      await axios.delete(`${url}/api/application/servers/${serverId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'Application/vnd.pterodactyl.v1+json',
        },
      });
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete server: ${error.message}`);
    }
  }

  // Suspend a server
  async suspendServer(panelUrl, apiKey, serverId) {
    const url = this.normalizeUrl(panelUrl);
    try {
      await axios.post(
        `${url}/api/application/servers/${serverId}/suspend`,
        {},
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'Application/vnd.pterodactyl.v1+json',
          },
        }
      );
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to suspend server: ${error.message}`);
    }
  }

  // Unsuspend a server
  async unsuspendServer(panelUrl, apiKey, serverId) {
    const url = this.normalizeUrl(panelUrl);
    try {
      await axios.post(
        `${url}/api/application/servers/${serverId}/unsuspend`,
        {},
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'Application/vnd.pterodactyl.v1+json',
          },
        }
      );
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to unsuspend server: ${error.message}`);
    }
  }

  // Send power action (start, stop, restart, kill)
  async sendPowerAction(panelUrl, apiKey, serverId, action) {
    const url = this.normalizeUrl(panelUrl);
    try {
      await axios.post(
        `${url}/api/application/servers/${serverId}/power`,
        { signal: action },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'Application/vnd.pterodactyl.v1+json',
          },
        }
      );
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to send power action: ${error.message}`);
    }
  }

  // Get server resources usage
  async getServerResources(panelUrl, apiKey, serverId) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const response = await axios.get(
        `${url}/api/application/servers/${serverId}/resources`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'Application/vnd.pterodactyl.v1+json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get server resources: ${error.message}`);
    }
  }

  // Update server build/limits
  async updateServer(panelUrl, apiKey, serverId, limits) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const response = await axios.patch(
        `${url}/api/application/servers/${serverId}/build`,
        {
          limits: {
            memory: limits.memory,
            swap: limits.swap || 0,
            disk: limits.disk,
            io: limits.io || 500,
            cpu: limits.cpu,
          },
          feature_limits: {
            databases: limits.databases || 0,
            allocations: limits.allocations || 1,
            backups: limits.backups || 0,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'Application/vnd.pterodactyl.v1+json',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update server: ${JSON.stringify(error.response?.data) || error.message}`);
    }
  }

  // Get current state of a server (running/stopped/starting/stopping)
  async getServerState(panelUrl, apiKey, serverId) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const response = await axios.get(
        `${url}/api/application/servers/${serverId}`,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'Application/vnd.pterodactyl.v1+json',
          },
        }
      );
      const attr = response.data?.attributes || response.data?.data?.attributes || response.data;
      return { state: attr?.status || null, ...attr };
    } catch (error) {
      throw new Error(`Failed to get server state: ${error.message}`);
    }
  }

  // Get all nodes
  async getNodes(panelUrl, apiKey) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const response = await axios.get(`${url}/api/application/nodes`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'Application/vnd.pterodactyl.v1+json',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get nodes: ${error.message}`);
    }
  }

  // Get all eggs
  async getEggs(panelUrl, apiKey, nodeId = null) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const eggUrl = nodeId
        ? `${url}/api/application/nodes/${nodeId}/eggs`
        : `${url}/api/application/eggs`;
      
      const response = await axios.get(eggUrl, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'Application/vnd.pterodactyl.v1+json',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get eggs: ${error.message}`);
    }
  }

  // Get locations
  async getLocations(panelUrl, apiKey) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const response = await axios.get(`${url}/api/application/locations`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'Application/vnd.pterodactyl.v1+json',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get locations: ${error.message}`);
    }
  }

  // Get allocations for a node
  async getAllocations(panelUrl, apiKey, nodeId) {
    const url = this.normalizeUrl(panelUrl);
    try {
      const response = await axios.get(`${url}/api/application/nodes/${nodeId}/allocations`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'Application/vnd.pterodactyl.v1+json',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get allocations: ${error.message}`);
    }
  }
}

export const pterodactylService = new PterodactylService();
