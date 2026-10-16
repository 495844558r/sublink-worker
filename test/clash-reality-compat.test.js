import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

const build = async (input) => yaml.load(await new ClashConfigBuilder(
    input, 'minimal', [], null, 'zh-CN', 'mihomo'
).build());

describe('Clash VLESS REALITY compatibility', () => {
    it.each(['tcp', 'grpc'])('enables hybrid key exchange for %s share links', async (network) => {
        const input = 'vless://11111111-1111-4111-8111-111111111111@example.com:443'
            + '?security=reality&sni=example.org&fp=chrome&pbk=test-public-key&sid=aabb'
            + `&type=${network}&serviceName=test-service`
            + (network === 'tcp' ? '&flow=xtls-rprx-vision' : '') + '#Test';
        const result = await build(input);
        const proxy = result.proxies[0];
        expect(proxy['reality-opts']).toEqual({
            'public-key': 'test-public-key',
            'short-id': 'aabb',
            'support-x25519mlkem768': true,
        });
        expect(proxy.network).toBe(network);
        expect(proxy.servername).toBe('example.org');
        expect(proxy['client-fingerprint']).toBe('chrome');
        if (network === 'grpc') {
            expect(proxy['grpc-opts']['grpc-service-name']).toBe('test-service');
            expect(proxy.flow).toBeUndefined();
        } else {
            expect(proxy.flow).toBe('xtls-rprx-vision');
        }
    });

    it('does not add REALITY to ordinary TLS nodes', async () => {
        const result = await build('vless://11111111-1111-4111-8111-111111111111@example.com:443?security=tls&sni=example.org&type=tcp#TLS');
        expect(result.proxies[0].tls).toBe(true);
        expect(result.proxies[0]['reality-opts']).toBeUndefined();
    });

});
