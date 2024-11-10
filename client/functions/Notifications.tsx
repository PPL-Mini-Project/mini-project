import { agentWallet } from './agent';
import { PushAPI, CONSTANTS } from '@pushprotocol/restapi';
import { channelAddress } from '@/lib/constants';
import { getUserAccount } from './user';

// fetch the Agent account and returns the PUSHAPI of Agent
async function getAgentAccount() {
    const signer = await agentWallet();
    const agent = await PushAPI.initialize(signer, {
        env: CONSTANTS.ENV.STAGING,
    });
    return agent;
}

// Subscribe the user to channel
async function subscribeToChannel() {
    const signer = await getUserAccount();
    const user = await PushAPI.initialize(signer, {
        env: CONSTANTS.ENV.STAGING,
    });
    const response = await user.notification.subscribe(
        `eip155:11155111:${channelAddress}`
    );
}

// Send the notification
async function sendNotification(title: string, body: string,target:string[]) {

    const agent = await getAgentAccount();

    await agent.channel.send(target, {
        notification: {
            title: title,
            body: body,
        }
    });

}

export { sendNotification,subscribeToChannel }