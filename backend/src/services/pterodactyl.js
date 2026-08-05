import axios from 'axios';

class PterodactylService {
  constructor() {
    this.timeout = 30000;
  }

  // Test connection to Pterodactyl panel
  async testConnection(panelUrl, apiKey) {
    try {
      const response = await axios.get(`${panelUrl}/api/application`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'Application/vnd.pterodactyl.v1+json',
        },
        timeout: this.timeout,
      });
      return { success: true, status: response.status };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      };
    }
  }

  // Create a new user on Pterodactyl
  async createUser(panelUrl, apiKey, userData) {
    try {
      const response = await axios.post(
        `${panelUrl}/api/application/users`,
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
      return response.data;
    } catch (error) {
      throw new Error(`Failed to create Pterodactyl user: ${error.response?.data?.errors?.[0]?.code || error.message}`);
    }
  }

  // Get user by email
  async getUserByEmail(panelUrl, apiKey, email) {
    try {
      const response = await axios.get(`${panelUrl}/api/application/users`, {
        params: { filter: { email } },
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'Application/vnd.pterodactyl.v1+json',
        },
      });
      return response.data.data[0] || null;
    } catch (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  // Create a new server
  async createServer(panelUrl, apiKey, serverData) {
    try {
      const response = await axios.post(
        `${panelUrl}/api/application/servers`,
        {
          name: serverData.name,
          user: serverData.userId,
          node: serverData.nodeId,
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
          deployment: {
            dedicated_ip: false,
            port_range: [],
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
      throw new Error(`Failed to create server: ${JSON.stringify(error.response?.data) || error.message}`);
    }
  }

  // Get server details
  async getServerInfo(panelUrl, apiKey, serverId) {
    try {
      const response = await axios.get(
        `${panelUrl}/api/application/servers/${serverId}`,
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
    try {
      await axios.delete(`${panelUrl}/api/application/servers/${serverId}`, {
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
    try {
      await axios.post(
        `${panelUrl}/api/application/servers/${serverId}/suspend`,
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
    try {
      await axios.post(
        `${panelUrl}/api/application/servers/${serverId}/unsuspend`,
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
    try {
      await axios.post(
        `${panelUrl}/api/application/servers/${serverId}/power`,
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
    try {
      const response = await axios.get(
        `${panelUrl}/api/application/servers/${serverId}/resources`,
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

  // Get all nodes
  async getNodes(panelUrl, apiKey) {
    try {
      const response = await axios.get(`${panelUrl}/api/application/nodes`, {
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
    try {
      const url = nodeId
        ? `${panelUrl}/api/application/nodes/${nodeId}/eggs`
        : `${panelUrl}/api/application/eggs`;
      
      const response = await axios.get(url, {
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
    try {
      const response = await axios.get(`${panelUrl}/api/application/locations`, {
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
}

export const pterodactylService = new PterodactylService();