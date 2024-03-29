<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [clm-core](./clm-core.md) &gt; [JwtService](./clm-core.jwtservice.md) &gt; [verifyToken](./clm-core.jwtservice.verifytoken.md)

## JwtService.verifyToken() method

Verify a token

<b>Signature:</b>

```typescript
verifyToken(token: string, secret?: string): Promise<TokenVerifyResult>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  token | string | Token to verify (which is usually provided by means of REST communication) |
|  secret | string | <i>(Optional)</i> The secret to test verify against |

<b>Returns:</b>

Promise&lt;[TokenVerifyResult](./clm-core.tokenverifyresult.md)<!-- -->&gt;

