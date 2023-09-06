const opener = require('opener');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const readlineSync = require('readline-sync');
const request = require('request');

async function getOpenId() {
  const devLocalPath = path.join(__dirname, '../config', '.dev-local.json');

  if (fs.pathExistsSync(devLocalPath)) {
    const json = fs.readJsonSync(devLocalPath);
    if (json.open_id) {
      return json.open_id;
    }
  }

  opener('https://unismart.feishu.cn/docx/ZS21dEK4RozmuHxWliyckhdGn3g#WCA2dG4osoGsmWxq6rxcnH1Knlb');

  const open_id = readlineSync.question('Input open id: ');
  await fs.ensureDir(path.join(__dirname, '../config'));
  fs.writeFileSync(devLocalPath, JSON.stringify({ open_id }, null, 2));
  return open_id;
}

async function getTenantAccessToken() {
  const { data } = await axios.post('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    app_id: 'cli_a33d5ab1577f5013',
    app_secret: 'iKiE0Smnentn8Je9ENzrMbURJKQw7OFp',
  });
  return data.tenant_access_token;
}

function uploadFile(path, name) {
  return new Promise(async (rs, rj) => {
    request({
      method: 'POST',
      url: 'https://www.feishu.cn/approval/openapi/v2/file/upload',
      headers: {
        Authorization: 'Bearer ' + await getTenantAccessToken(),
      },
      formData: {
        content: {
          value: fs.createReadStream(path),
          options: {
            filename: name,
            contentType: null,
          },
        },
        name: name,
        type: 'attachment',
      },
    }, (error, response) => {
      if (error) {
        rj(error);
        return;
      }
      const { code } = JSON.parse(response.body).data;
      code ? rs (code) : rj(response.body);
    });
  });
}

const APPROVAL_CODE = '1B7546D3-6CBF-4BF6-9B5D-86CD2F5C2AA9';
const APPROVAL_NODE_ID = 'd55d78a399fb9f7ebeb45bdad8e3d20d';
const APPROVAL_NODE_USER_ID = '23g5ffac';
const APPROVAL_NODE_OPEN_ID = 'ou_ff3fc3dec03da18d153309c5f3964814';

async function createApproval(version, updated) {
  console.log('>>>>>>>> start upload file');
  const chromeFileCode = await uploadFile(path.join(__dirname, '../build', 'chrome.zip'), `chrome-${version}.zip`);
  const firefoxFileCode = await uploadFile(path.join(__dirname, '../build', 'firefox.zip'), `firefox-${version}.zip`);
  const srcFileCode = await uploadFile(path.join(__dirname, '../src.zip'), `src-${version}.zip`);
  console.log('>>>>>>>> finish upload file');

  return new Promise(async (rs, rj) => {
    try {
      request({
        method: 'POST',
        url: 'https://open.feishu.cn/open-apis/approval/v4/instances',
        headers: {
          Authorization: 'Bearer ' + (await getTenantAccessToken()),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approval_code: APPROVAL_CODE,
          open_id: await getOpenId(),
          form: `[{\"id\":\"widget16510612334190001\",\"type\":\"input\",\"value\":\"${version}\"},{\"id\":\"widget16729963063720001\",\"type\":\"textarea\",\"value\":\"${updated}\"},{\"id\":\"widget16729963388800001\",\"type\":\"attachmentV2\",\"value\":[\"${chromeFileCode}\"]},{\"id\":\"widget16729963661760001\",\"type\":\"attachmentV2\",\"value\":[\"${firefoxFileCode}\"]},{\"id\":\"widget16729964173310001\",\"type\":\"attachmentV2\",\"value\":[\"${srcFileCode}\"]}]`,
          node_approver_user_id_list: [
            {
              key: APPROVAL_NODE_ID,
              value: [APPROVAL_NODE_USER_ID],
            },
            {
              key: 'manager_node_id',
              value: [APPROVAL_NODE_USER_ID],
            },
          ],
          node_approver_open_id_list: [
            {
              key: APPROVAL_NODE_ID,
              value: [APPROVAL_NODE_OPEN_ID],
            },
            {
              key: 'manager_node_id',
              value: [APPROVAL_NODE_OPEN_ID],
            },
          ],
          node_cc_user_id_list: [
            {
              key: APPROVAL_NODE_ID,
              value: [APPROVAL_NODE_USER_ID],
            },
            {
              key: 'manager_node_id',
              value: [APPROVAL_NODE_USER_ID],
            },
          ],
          node_cc_open_id_list: [
            {
              key: APPROVAL_NODE_ID,
              value: [APPROVAL_NODE_OPEN_ID],
            },
            {
              key: 'manager_node_id',
              value: [APPROVAL_NODE_OPEN_ID],
            },
          ],
          user_id: '1dd9b845',
        }),
      }, (error, response) => {
        if (error) {
          rj(error);
          return;
        }
        const resJson = JSON.parse(response.body);
        const { instance_code: code } = resJson.data;
        code ? rs (code) : rj(response.body);
      });
    } catch (err) {
      rj(err);
    }
  });
}

module.exports = {
  createApproval,
};
