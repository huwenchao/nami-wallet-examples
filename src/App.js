import React, { useEffect, useState } from 'react';
import DateTimePicker from 'react-datetime-picker';
import './App.css';

import NamiWalletApi, { Cardano } from './nami-js';
import blockfrostApiKey from '../config.js';
import * as ms from '@emurgo/cardano-message-signing-asmjs';
let nami;

function toByteArray(hexString) {
    var result = [];
    for (var i = 0; i < hexString.length; i += 2) {
        result.push(parseInt(hexString.substr(i, 2), 16));
    }
    return result;
}

export default function App() {
    const [connected, setConnected] = useState()
    const [address, setAddress] = useState()
    const [nfts, setNfts] = useState([])
    const [balance, setBalance] = useState()
    const [transaction, setTransaction] = useState()
    const [amount, setAmount] = useState("10")
    const [txHash, setTxHash] = useState()
    const [recipientAddress, setRecipientAddress] = useState("addr_test1qqsjrwqv6uyu7gtwtzvhjceauj8axmrhssqf3cvxangadqzt5f4xjh3za5jug5rw9uykv2klc5c66uzahu65vajvfscs57k2ql")
    const [witnesses, setWitnesses] = useState()
    const [policy, setPolicy] = useState()
    const [builtTransaction, setBuiltTransaction] = useState() 

    const [complextxHash, setComplextxHash] = useState()
    const [policyExpiration, setPolicyExpiration] = useState(new Date());
    const [complexTransaction, setComplexTransaction] = useState({recipients: [{address:"addr_test1qqsjrwqv6uyu7gtwtzvhjceauj8axmrhssqf3cvxangadqzt5f4xjh3za5jug5rw9uykv2klc5c66uzahu65vajvfscs57k2ql", 
        amount: "3", 
        mintedAssets:[{assetName: "MyNFT", quantity:'1',  policyId: "Example PolicyID", 
        policyScript:"ExamplePolicy"}] }]})

    useEffect(() => {
        const defaultDate = new Date();
        defaultDate.setTime(defaultDate.getTime() + (1 * 60 * 90 * 1000))
        setPolicyExpiration(defaultDate);

    }, [])
    useEffect(() => {
        async function t() {

            const S = await Cardano();
            nami = new NamiWalletApi(
                S,
                window.cardano,
               blockfrostApiKey
            )


            if (await nami.isInstalled()) {
                await nami.isEnabled().then(result => { setConnected(result) })

            }
        }

        t()
    }, [])


    function toHex(str) {
        var result = '';
        for (var i=0; i<str.length; i++) {
            result += str.charCodeAt(i).toString(16);
        }
        console.log(result)
        return result;
    }

    const connect = async () => {
        // Connects nami wallet to current website 
        // await nami.enable()
        //     .then(result => setConnected(result))
        //     .catch(e => console.log(e))
        // console.log({ namiAddr: await nami.getAddress()})
        const api = await window.cardano.nami.enable();
        // console.log(api)
        // console.log({ network: await api.getNetworkId() })
        // console.log({ balance: await api.getBalance() })
        // console.log({ changeAddress: await api.getChangeAddress() })
        // console.log({ getUsedAddresses: await api.getUsedAddresses() })
        // console.log({ getUnusedAddresses: await api.getUnusedAddresses() })
        // console.log({ rewardAddresses: await api.getRewardAddresses() })
        // let payload = 'message to sign';
        // const signedData = await api.signData(await api.getRewardAddresses()[0], toHex(payload))
        // console.log({ signedData })
        // import * as ms from '@emurgo/cardano-message-signing-browser';
        // const ms = require('@emurgo/cardano-message-signing-browser');
        // let protected_headers = ms.HeaderMap.new();
        // let protected_serialized = ms.ProtectedHeaderMap.new(protected_headers);
        // let unprotected = ms.HeaderMap.new();
        // let headers = ms.Headers.new(protected_serialized, unprotected);
        // let payload = new TextEncoder().encode('message to sign');
        // let external_aad = new TextEncoder().encode('externally supplied data not in sign object');
        // let builder = ms.COSESign1Builder.new(headers, payload, false);
        // builder.set_external_aad(external_aad);
        // let to_sign = builder.make_data_to_sign().to_bytes();
        // console.log({ payload, external_aad, to_sign });
        // const cardano = window.cardano;
        // let payload = 'message to sign';
        const payload = toByteArray('846a5369676e6174757265315846a20127676164647265737358390091e4c8bb')
        const address = await api.getChangeAddress();
        // console.log({ address });
        const signedData = await api.signData(address, payload);
        console.log({ signedData, address });
        // const core_sign1 = ms.COSESign1.from_bytes(signedData);
        // const payload1 = core_sign1.payload();
        // const headers = core_sign1.headers();
        // const signature = core_sign1.signature();
        // console.log({ payload1, headers, signature });
        // const address = (await api.getUsedAddresses())[0];
        // console.log({ address });
        // const signedData = await api.signData(address, to_sign);
    }

    const getAddress = async () => {
        // retrieve address of nami wallet
        if (!connected) {
            await connect()
        }
        await nami.getAddress().then((newAddress) => { console.log(newAddress); setAddress(newAddress) })
    }


    const getBalance = async () => {
        if (!connected) {
            await connect()
        }
        await nami.getBalance().then(result => { console.log(result); setNfts(result.assets); setBalance(result.lovelace) })
    }


    const buildTransaction = async () => {
        if (!connected) {
            await connect()
        }

        const recipients = [{ "address": recipientAddress, "amount": amount }]
        let utxos = await nami.getUtxosHex();
        const myAddress = await nami.getAddress();
        
        let netId = await nami.getNetworkId();
        const t = await nami.transaction({
            PaymentAddress: myAddress,
            recipients: recipients,
            metadata: null,
            utxosRaw: utxos,
            networkId: netId.id,
            ttl: 3600,
            multiSig: null
        })
        console.log(t)
        setTransaction(t)
    }



    const buildFullTransaction = async () => {
        if (!connected) {
            await connect()
        }
        try {
        const recipients = complexTransaction.recipients
        const metadataTransaction = complexTransaction.metadata
        console.log(metadataTransaction)
        let utxos = await nami.getUtxosHex();
        
        const myAddress = await nami.getAddress();
        console.log(myAddress)
        let netId = await nami.getNetworkId();

        const t = await nami.transaction({
            PaymentAddress: myAddress,
            recipients: recipients,
            metadata: metadataTransaction,
            utxosRaw: utxos,
            networkId: netId.id,
            ttl: 3600,
            multiSig: null
        })
        setBuiltTransaction(t)
        const signature = await nami.signTx(t)
        console.log(t, signature, netId.id)
        const txHash = await nami.submitTx({
            transactionRaw: t,
            witnesses: [signature],

            networkId: netId.id
        })
        console.log(txHash)
        setComplextxHash(txHash)
    } catch (e){
        console.log(e)
    }
    }


    
    const signTransaction = async () => {
        if (!connected) {
            await connect()
        }

        const witnesses = await nami.signTx(transaction)
        setWitnesses(witnesses)
        console.log(witnesses)
    }

    const submitTransaction = async () => {
        let netId = await nami.getNetworkId();
        const txHash = await nami.submitTx({
            transactionRaw: transaction,
            witnesses: [witnesses],

            networkId: netId.id
        })
        setTxHash(txHash)

    }

    const createPolicy = async () => {
        console.log(policyExpiration)
        try {
            await nami.enable()


            const myAddress = await nami.getHexAddress();
            
            let networkId = await nami.getNetworkId()
            const newPolicy = await nami.createLockingPolicyScript(myAddress, networkId.id, policyExpiration)

            setPolicy(newPolicy)
            setComplexTransaction((prevState) => 
            {const state = prevState;   state.recipients[0].mintedAssets[0].policyId = newPolicy.id; 
                state.recipients[0].mintedAssets[0].policyScript = newPolicy.script; 
                state.metadata = {"721": {[newPolicy.id]: 
                    {[state.recipients[0].mintedAssets[0].assetName]: {name: "MyNFT", description: "Test NFT", image: "ipfs://QmUb8fW7qm1zCLhiKLcFH9yTCZ3hpsuKdkTgKmC8iFhxV8"}} }};
                 return {...state}})

        } catch (e) {
            console.log(e)
        }

    }

    return (<>
        <div className="container">
            <h1 style={{ textAlign: "center" }}>Introduction to basic Nami wallet functionalities</h1>
            <p>In these small examples we demonstrate basic Nami wallet functionalities.</p>
            <p>If you do not have Nami Wallet installed you can download Nami Wallet <a href="https://namiwallet.io/" target="_blank"> here</a>.</p>
            <div className="container">
                <div className="row" >
                    <h1> 1. Connect your website to Nami Wallet</h1>
                </div>
                <div className="row" >
                    <button className={`button ${connected ? "success" : ""}`} onClick={connect} > {connected ? "Connected" : "Connect to Nami"} </button>
                </div>
                <div className="row" >
                    <h1> 2. Retrieve your Nami wallet address</h1>
                </div>
                <div className="row" >
                    <button className={`button ${address ? "success" : ""}`} onClick={getAddress}> Get Your Address </button>
                    {address && <div className="item address">
                        <p>My Address:  {address} </p>
                    </div>}
                </div>
                <div className="row" >
                    <h1> 3. Retrieve your balance and NFTs</h1>
                </div>
                <div className="row" >
                    <button className={`button ${balance ? "success" : ""}`} onClick={getBalance}> Get Your Balance and NFTs </button>
                    {balance && <> <div className="column" >
                        <div className="item balance"><p>Balance ₳:  {balance / 1000000.} </p>

                        </div>


                        {nfts.map((nft) => {
                            return <><div className="item nft"><p>unit: {nft.unit}</p>
                                <p>quantity: {nft.quantity}</p>
                                <p>policy: {nft.policy}</p>
                                <p>name: {nft.name}</p>
                                <p>fingerprint: {nft.fingerprint}</p>
                            </div>
                            </>

                        })}
                    </div>
                    </>
                    }

                </div>
                <div className="row" >
                    <h1> 4. Build Transaction</h1>
                </div>
                <div className="row" >
                    <button className={`button ${(transaction) ? "success" : ""}`} onClick={() => { if (amount && recipientAddress) buildTransaction() }}> Build Transaction</button>
                    <div className="column" >



                        <div className="item address"><p> Amount</p><input style={{ width: "400px", height: "30px", }}
                            value={amount}
                            onChange={(event) => setAmount(event.target.value.toString())} /></div>

                        <div className="item address"><p> Recipient Address</p>
                            <input style={{ width: "400px", height: "30px" }}
                                value={recipientAddress}
                                onChange={(event) => setRecipientAddress(event.target.value.toString())} /></div>

                    </div>




                </div>

                <div className="row" >
                    <h1> 5. Sign Transaction</h1>
                </div>
                <div className="row" >
                    <button className={`button ${(witnesses) ? "success" : ""}`} onClick={() => { if (transaction) signTransaction() }}> Sign Transaction</button>
                    <div className="column" >






                    </div>
                </div>
                <div className="row" >
                    <h1> 6. Submit Transaction</h1>
                </div>
                <div className="row" >
                    <button className={`button ${(txHash) ? "success" : ""}`} onClick={() => { console.log(witnesses); if (witnesses) submitTransaction() }}> Submit Transaction</button>

                    <div className="column" >
                        <div className="item address">
                            <p>TxHash:  {txHash} </p>
                        </div>





                    </div>

                </div>
                <div className="row" >
                    <h1> 7. Create Policy Script</h1>
                </div>
                <div className="row" >
                    <button className={`button ${(policy) ? "success" : ""}`} onClick={() => { if (policyExpiration) createPolicy() }}> Create Policy</button>

                    <div className="column" >
                    <p>Set Policy Expriaton Date: <DateTimePicker
                               
                               onChange={setPolicyExpiration}
                               value={policyExpiration}
                               minDate={new Date()}
                           />
                           </p>
                        <div className="item address">
                        
                            <p>policyId:  {policy?.id} </p>
                            <p>policyScript:  {policy?.script} </p>
                            <p>paymentKeyHash:  {policy?.paymentKeyHash} </p>
                            <p>ttl:  {policy?.ttl} </p>
                        </div>





                    </div>

                </div>



            </div>

            

                <div className="row" >
                    <h1> 8. Build Full Transaction (incl. Minting)</h1>
                </div>
                <div className="row" >
                    <button className={`button ${(complextxHash) ? "success" : ""}`} onClick={ buildFullTransaction}> Build Transaction</button>
                    <div className="column" >


                    <div className="item address">
                            <p>Complex TxHash:  {complextxHash} </p>
                        </div>

                        <div className="item address"><p> Recipients Input</p><textarea style={{ width: "400px", height: "500px", }}
                            value={JSON.stringify(complexTransaction)}
                            onChange={(event) => 
                            {setComplexTransaction((prevState) =>( {...JSON.parse(event.target.value)}))}} />
                            </div>

                      

                   
                    <div className="item address"><p>Transaction Hash: </p> <textarea style={{ width: "400px", height: "500px", }} 
                    value={builtTransaction} />

                    </div>
                    </div>



                </div>
            
            
        </div>

    </>
    )
}



    