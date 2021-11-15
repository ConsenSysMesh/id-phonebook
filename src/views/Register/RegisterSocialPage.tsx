import { useContext, useState } from "react";
import { useHistory } from "react-router-dom";
import { mutate } from "swr";
import { PhonebookContext } from "../../context/PhonebookProvider";
import { PhonebookService } from "../../services/PhonebookService";
import { Box, Flex, Checkbox, Button, Input, Loader, Text } from "rimble-ui";
import { AccountBalanceWallet, Eth, Refresh } from "@rimble/icons";
import {
  baseColors,
  CircleOne,
  CircleTwo,
  CircleThree,
  CircleFour,
  CircleFive,
  colors,
  H6,
  DropDown,
  fonts,
  ReverseOutlineOne,
  ReverseOutlineTwo,
  ReverseOutlineThree,
  ReverseOutlineFour,
  ReverseOutlineFive,
  GreenCircleCheck,
  H4,
} from "serto-ui";
import { RegisterGlobal } from "./RegisterGlobal";
import Web3 from "web3";
import { canonicalize } from "json-canonicalize";
import { SocialMediaPlatform } from "../../constants";
import styled from "styled-components";
import { domainRegex } from "../../utils/helpers";
import { saveAs } from "file-saver";
import { constructDomainLinkage, constructSocialMediaProfileLinkage, domainLinkageTypes, socialMediaProfileLinkageTypes } from "./constructCredentials";

const StepText = styled(Text)`
  font-family: ${fonts.sansSerif};
  font-size: 16px;
  font-weight: 400;
  line-height: 22.12px;
`;

const StepDescription = styled(Text)`
  font-family: ${fonts.sansSerifHeader};
  font-size: 16px;
  font-weight: 600;
  line-height: 22.12px;
`;

const SubstepDescription = styled(Text)`
  font-family: ${fonts.sansSerifHeader};
  font-size: 16px;
  font-weight: 400;
  line-height: 22.12px;
`;

const VcText = styled(Text)`
 word-break: break-all;
`;

export const RegisterSocialPage: React.FunctionComponent = () => {
  const Phonebook = useContext<PhonebookService>(PhonebookContext);
  const history = useHistory();

  const [error, setError] = useState<any | undefined>();
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [ethAddress, setEthAddress] = useState("");
  const [vc, setVc] = useState<any>(undefined);
  const [platform, setPlatform] = useState<string>("");
  const [profileUrl, setProfileUrl] = useState<string>("");
  const [checkboxChecked, setCheckboxChecked] = useState<boolean>(false);
  const [postUrl, setPostUrl] = useState<string>("");
  const [linkedId, setLinkedId] = useState<string>("");
  const [did, setDid] = useState<string>("");
  const web3 = new Web3(Web3.givenProvider);

  /* @ts-ignore: Something */
  window.ethereum?.on("accountsChanged", function (accounts) {
    setEthAddress(accounts[0]);
    setStep(accounts[0] ? 1 : 0);
  });

  const [step, setStep] = useState<number>(ethAddress ? 1 : 0);

  const dropDownOptions = [
    { name: "SELECT", value: "" },
    { name: SocialMediaPlatform.DOMAIN, value: SocialMediaPlatform.DOMAIN },
    { name: SocialMediaPlatform.FACEBOOK, value: SocialMediaPlatform.FACEBOOK },
    { name: SocialMediaPlatform.INSTAGRAM, value: SocialMediaPlatform.INSTAGRAM },
    { name: SocialMediaPlatform.MEDIUM, value: SocialMediaPlatform.MEDIUM },
    { name: SocialMediaPlatform.TWITTER, value: SocialMediaPlatform.TWITTER },
    { name: SocialMediaPlatform.YOUTUBE, value: SocialMediaPlatform.YOUTUBE },
  ];

  async function signSocialMediaLinkageCredential() {
    setError("");
    setIsValidating(true);

    const did = "did:ethr:" + ethAddress;
    const date = new Date().toISOString();

    let message = constructSocialMediaProfileLinkage(did, date, profileUrl);

    const domain = {
      chainId: 1,
      name: "SocialMediaProfileLinkage",
      version: "1",
    };

    const types = socialMediaProfileLinkageTypes;

    const from = ethAddress;
    const obj = { types, domain, primaryType: "VerifiableCredential", message };
    const canonicalizedObj = canonicalize(obj);
    console.log("canonicalizedObj: ", canonicalizedObj);

    /* @ts-ignore: Ignore TS issue */
    web3?.currentProvider?.sendAsync(
      { method: "eth_signTypedData_v4", params: [from, canonicalizedObj], from },
      /* @ts-ignore: Ignore TS issue */
      (err, res) => {
        if (err) {
          setIsValidating(false);
        } else {
          console.log("res: ", res);

          const newObj = JSON.parse(JSON.stringify(message));

          newObj.proof.proofValue = res.result;

          newObj.proof.eip712Domain = {
            domain,
            messageSchema: types,
            primaryType: "VerifiableCredential",
          };

          setVc(newObj);
          setIsValidating(false);
          setStep(step + 1);
        }
      },
    );
  }

  
  async function signDomainLinkageCredential() {
    setError("");
    setIsValidating(true);

    const did = "did:ethr:" + ethAddress;
    const date = new Date().toISOString();

    let message = constructDomainLinkage(did, date, profileUrl);

    const domain = {
      chainId: 1,
      name: "DomainLinkage",
      version: "1",
    };

    const types = domainLinkageTypes;

    const from = ethAddress;
    const obj = { types, domain, primaryType: "VerifiableCredential", message };
    const canonicalizedObj = canonicalize(obj);
    console.log("canonicalizedObj: ", canonicalizedObj);

    /* @ts-ignore: Ignore TS issue */
    web3?.currentProvider?.sendAsync(
      { method: "eth_signTypedData_v4", params: [from, canonicalizedObj], from },
      /* @ts-ignore: Ignore TS issue */
      (err, res) => {
        if (err) {
          setIsValidating(false);
        } else {
          console.log("res: ", res);

          const newObj = JSON.parse(JSON.stringify(message));

          newObj.proof.proofValue = res.result;

          newObj.proof.eip712Domain = {
            domain,
            messageSchema: types,
            primaryType: "VerifiableCredential",
          };

          setVc(newObj);
          setIsValidating(false);
          setStep(step + 1);
        }
      },
    );
  }

  async function submitCredential() {
    setError("");
    setIsValidating(true);
    try {
      const res = await Phonebook.registerSocial(postUrl);
      setIsValidating(false);
      mutate("/add-social-media-linkage");
      setStep(5);
      setLinkedId(res.linkedId);
      setPlatform(res.platform);
      setDid(res.did);
    } catch (error: any) {
      console.error(error);
      setError(error);
      setIsValidating(false);
      return;
    }
  }
  
  async function submitDomain() {
    setError("");
    setIsValidating(true);
    try {
      await Phonebook.registerDomain(postUrl);
      setIsValidating(false);
      mutate("/register");
      setStep(5);
      setLinkedId(postUrl);
    } catch (error: any) {
      console.error(error);
      setError(error);
      setIsValidating(false);
      return;
    }
  }

  const vcString = JSON.stringify(vc);

  let platformPrefix = "";
  switch (platform) {
    case SocialMediaPlatform.FACEBOOK:
      platformPrefix = "https://facebook.com/";
      break;
    case SocialMediaPlatform.INSTAGRAM:
      platformPrefix = "https://instagram.com/";
      break;
    case SocialMediaPlatform.MEDIUM:
      platformPrefix = "https://medium.com/";
      break;
    case SocialMediaPlatform.TWITTER:
      platformPrefix = "https://twitter.com/";
      break;
    case SocialMediaPlatform.YOUTUBE:
      platformPrefix = "https://youtube.com/channel/";
      break;
  }

  const stepColors = [
    colors.lightSilver,
    colors.lightSilver,
    colors.lightSilver,
    colors.lightSilver,
    colors.lightSilver,
  ];
  for (var i = 0; i < 5; i++) {
    if (step > i) {
      stepColors[i] = "#1F9665";
    } else if (step === i) {
      stepColors[i] = colors.darkGray;
    }
  }

  return (
    <RegisterGlobal>
      <Text mb={5}>
        Use verifiable credentials to link your Ethereum address to your public accounts and domains
      </Text>
      {step < 5 && (
        <>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            p={3}
            pl={4}
            pr={4}
            mt={2}
            mb={2}
            bg={colors.nearWhite}
          >
            <Flex alignItems="center">
              {(step > 0) && (<GreenCircleCheck size={"15px"}/>)}
              {(step === 0) && (<ReverseOutlineOne color={stepColors[0]}/>)}
              <StepText color={stepColors[0]} ml={2}>Connect Wallet</StepText>
            </Flex>
            <Flex alignItems="center">
              {(step > 1) && (<GreenCircleCheck size={"15px"}/>)}
              {(step <= 1) && (<ReverseOutlineTwo color={stepColors[1]} />)}
              <StepText color={stepColors[1]} ml={2}>Choose Identifier</StepText>
            </Flex>
            <Flex alignItems="center">
              {(step > 2) && (<GreenCircleCheck size={"15px"}/>)}
              {(step <= 2) && (<ReverseOutlineThree color={stepColors[2]} />)}
              <StepText color={stepColors[2]} ml={2}>Sign Linkage Credential</StepText>
            </Flex>
            <Flex alignItems="center">
              {(step > 3) && (<GreenCircleCheck size={"15px"}/>)}
              {(step <= 3) && (<ReverseOutlineFour color={stepColors[3]} />)}
              <StepText color={stepColors[3]} ml={2}>Publish or Host Proof</StepText>
            </Flex>
            <Flex alignItems="center">
              {(step > 4) && (<GreenCircleCheck size={"15px"}/>)}
              {(step <= 4) && (<ReverseOutlineFive color={stepColors[4]} />)}
              <StepText color={stepColors[4]} ml={2}>Submit Proof</StepText>
            </Flex>
          </Flex>
          <Flex flexDirection="row" alignItems="center" justifyContent="space-between" mb={4} mt={4}>
            <Flex flexDirection="row" alignItems="center" >
              {step === 0 && <CircleOne />}
              {step === 1 && <CircleTwo />}
              {step === 2 && <CircleThree />}
              {step === 3 && <CircleFour />}
              {step === 4 && <CircleFive />}
              <StepDescription ml={2}>
                {step === 0 && "Connect wallet and select the Ethereum address you want to link"}
                {step === 1 && "Choose identifier type you want to link to your Ethereum address"}
                {step === 2 && (platform === SocialMediaPlatform.DOMAIN ? "Enter the Domain name you want to link" : "Enter your account’s profile URL, and sign credential")}
                {step === 3 && (platform === SocialMediaPlatform.DOMAIN ? "Host the 'Domain Linkage' file on your organization's website" : "Publish your new credential to your account")}
                {step === 4 && (platform === SocialMediaPlatform.DOMAIN ? "Submit Domain to be added to Serto Search" : "Submit proof by entering social media post URL containing your published credential")}
              </StepDescription>
            </Flex>
            {step > 0 && (
              <Flex 
                color={baseColors.blurple}
                onClick={async () => {
                  try {
                    setError("");
                    setStep(0);
                    setPlatform("");
                    setProfileUrl("");
                    setPostUrl("");
                    setVc({});
                  } catch (error) {
                    console.log("error: ", error);
                    setError("Error disconnecting wallet. Please refresh page and try again.");
                  }
                }
              }>
                <Refresh />
                <Text fontWeight={3}>
                  Start Over
                </Text>
              </Flex>
            )}
          </Flex>
        </>
      )}
      {step === 5 && (
        <Flex flexDirection="column" alignItems="center" p={2}>
          <GreenCircleCheck size={"45px"} />
          <H4>Success! Your account has been listed!</H4>
          <H6>Your {platform} account has been linked to {did}</H6>
        </Flex>
      )}
      {step !== 3 && (
        <Flex flexDirection="row">
          <Box
            ml={1}
            width="50%"
            border="1px solid"
            borderColor={(step === 0 || step >= 2) ? baseColors.blurple : colors.lightGray}
            bg={(step === 0 || step >= 2) ? colors.primary.border : colors.whites[0]}
            borderRadius={2}
            p={3}
          >
            {step <= 1 && (
              <H6 m={1} color={step === 0 ? colors.darkGray : colors.silver}>Public Identifier Type</H6>
            )}
            {step > 1 && (
              <H6 m={1} color={step === 2 ? colors.darkGray : colors.silver}>Profile URL</H6>
            )}

            {step === 0 && (
              <DropDown
                options={dropDownOptions}
                onChange={(value) => {
                  setPlatform(value);
                  if (value) {
                    setStep(1);
                  } else {
                    setStep(0);
                  }
                }}
              />
            )}
            {step === 1 && <DropDown options={dropDownOptions} defaultSelectedValue={platform} disabled={true} onChange={() => {}} />}
            {step === 2 && (
              <Input
                placeholder={(platform === SocialMediaPlatform.DOMAIN) ? "e.g. " + platformPrefix + "<profile>" : "e.g. mydomain.com"}
                onChange={(event: any) => {
                  setProfileUrl(event.target.value);
                }}
                width="100%"
              />
            )}
            {step > 3 && (
              <Input
                disabled={true}
                placeholder={"e.g. " + platformPrefix + "<profile>"}
                value={profileUrl}
                width="100%"
              />
            )}
          </Box>
          <Box
            mr={1}
            width="50%"
            height="156px"
            border="1px solid"
            borderColor={(!ethAddress && step > 0) ? baseColors.blurple : colors.lightGray}
            bg={(!ethAddress && step > 0) ? colors.primary.border : colors.whites[0]}
            borderRadius={2}
            p={3}
          >
            <Flex flexDirection="column" justifyContent="space-around">
            <H6 m={1} color={(step > 0 && !ethAddress) ? colors.darkGray : colors.silver}>Your Ethereum Address</H6>
            {ethAddress ? (
              <Box border="1px solid" borderColor={colors.lightGray} borderRadius={1} bg={colors.nearWhite} p={2}>
                <Flex flexDirection="row" justifyContent="space-between">
                  <Flex>
                    <Eth color={step > 0 ? colors.silver : colors.darkGray}/>
                    <Text ml={1}>
                      {ethAddress.substring(0, 6) + "..." + ethAddress.substring(ethAddress.length - 4)}
                    </Text>
                  </Flex>
                  <AccountBalanceWallet color={step > 0 ? colors.silver : colors.darkGray}/>
                </Flex>
              </Box>
            ) : (
              <Button
                disabled={step === 0}
                onClick={async () => {
                  try {
                    setError("");
                    await web3.eth.requestAccounts();
                    const accounts = await web3.eth.getAccounts();
                    const from = accounts[0];
                    setEthAddress(from);
                    setStep(1);
                  } catch (error) {
                    setError("Unable to connect to wallet. Contact support@serto.id if the issue persists.");
                  }
                }}
              >
                <Flex alignItems="center">
                  <AccountBalanceWallet /> Connect Wallet
                </Flex>
              </Button>
            )}
            </Flex>
          </Box>
        </Flex>
      )}
      {step === 3 && platform === SocialMediaPlatform.DOMAIN ? (
        <Flex flexDirection="column" width="800px">
          <Flex flexDirection="column" ml={5}>
            <Flex flexDirection="column" mb={2} mt={2}>
              <Flex flexDirection="row" mb={2} mt={2}>
                <StepDescription mr={3}>4.A</StepDescription>
                <SubstepDescription>To host the file on your website's domain, first download the Domain Linkage file.</SubstepDescription>
              </Flex>
              <Flex ml={6} mb={2} mt={2}>
                <Button onClick={() => {
                  const blob = new Blob([`{"@context":"https://identity.foundation/.well-known/contexts/did-configuration-v0.0.jsonld","linked_dids":[${vcString}]}`], {type: "text/plain;charset=utf-8"});
                  saveAs(blob, "did-configuration.json");
                }}>Download Domain Linkage File</Button>
              </Flex>
            </Flex>
            <Flex flexDirection="row">
              <StepDescription>4.B</StepDescription>
              <Flex flexDirection="column" ml={3}>
                <SubstepDescription>Then, upload this file to the .well-known portion of your website. You will need access to your website source files. The resulting URL should look like: http://www.yourwebiste.com/.well-known/did-configuration.json</SubstepDescription>
                <SubstepDescription as="a" href={"tktktktkt.com"} color={baseColors.consensysblue}>Learn more about .well-known</SubstepDescription>
              </Flex>
            </Flex>

            <Flex flexDirection="row" justifyContent="space-between" mt={5}>
              <Flex flexDirection="row" alignItems="center">
                <Checkbox
                  value={checkboxChecked}
                  onClick={(event: any) => {
                    setCheckboxChecked(event.target.checked);
                  }}
                />
                <Text>Yes, I have published my credential at the .well-known location</Text>
              </Flex>
              <Button
                disabled={!checkboxChecked}
                onClick={() => {
                  setStep(4);
                }}
              >
                Continue
              </Button>
            </Flex>
          </Flex>
        </Flex>
      ): (step === 3) && (
        <Flex flexDirection="column" width="800px">
          <Flex flexDirection="column" ml={5}>
            <Text fontSize={"14px"} lineHeight={"18px"} mb={4}>To prove that you control the account, publish a post of your credential from your account.
            <br />
            <br />
            Copy and paste the pre-populated message at your convenience:</Text>
            <Box border="1px solid" borderRadius={2} bg={colors.nearWhite} borderColor={colors.grey} p={3}>
              <VcText>
                I’m linking this account to my Decentralized Identifier (DID) My credential 👉
                https://search.serto.id/vc-validator?vc={encodeURIComponent(vcString)} #SertoID
              </VcText>
            </Box>
            <Flex flexDirection="row" justifyContent="space-between" mt={5}>
              <Flex flexDirection="row" alignItems="center">
                <Checkbox
                  value={checkboxChecked}
                  onClick={(event: any) => {
                    setCheckboxChecked(event.target.checked);
                  }}
                />
                <Text>Yes, I have published my credential</Text>
              </Flex>
              <Button
                disabled={!checkboxChecked}
                onClick={() => {
                  setStep(4);
                }}
              >
                Continue
              </Button>
            </Flex>
          </Flex>
        </Flex>
      )}
      {step === 4 && (
        <Box border="1px solid" borderRadius={2} borderColor={baseColors.blurple} p={2}>
          <H6>Social Media Post URL</H6>
          <Input
            placeholder={platform === SocialMediaPlatform.DOMAIN ? "e.g. mydomain.com" : "e.g. https://www.twitter.status/id/14444444444444"}
            value={postUrl}
            onChange={(event: any) => {
              setPostUrl(event.target.value);
            }}
            width="100%"
          />
          <Button
            disabled={!postUrl}
            onClick={async () => {
              if (platform === SocialMediaPlatform.DOMAIN) {
                await submitDomain();
              } else {
                await submitCredential();
              }
            }}
          >
            {isValidating ? <Loader color={baseColors.white} /> : <>Continue</>}
          </Button>
        </Box>
      )}
      <Text>{error}</Text>
      {step === 1 && (
        <Flex flexDirection="row" justifyContent="flex-end">
          <Button
            disabled={!platform! || !ethAddress}
            onClick={() => {
              setStep(step + 1);
            }}
            mb={3}
            mt={3}
            width="294px"
          >
            {isValidating ? <Loader color={baseColors.white} /> : <>Continue</>}
          </Button>
        </Flex>
      )}
      {step === 2 && (
        <Flex flexDirection="row" justifyContent="flex-end">
          <Button
            disabled={(platform === SocialMediaPlatform.DOMAIN) ? !domainRegex.test(profileUrl) : !profileUrl.startsWith(platformPrefix)}
            onClick={async () => {
              try {
                if (platform === SocialMediaPlatform.DOMAIN) {
                  await signDomainLinkageCredential();
                } else {
                  await signSocialMediaLinkageCredential();
                }
              } catch (error) {
                setError("Error signing Credential. Contact support@serto.id if issue persists.");
                console.error(error);
              }
            }}
            mb={3}
            mt={3}
            width="294px"
          >
            {isValidating ? <Loader color={baseColors.white} /> : <>Sign Linkage Credential</>}
          </Button>
        </Flex>
      )}
      {(step > 0 && step < 4) && <Button.Text onClick={() => setStep(4)}>Skip. I've already posted my credential.</Button.Text>}
      {step === 5 && (
        <Flex flexDirection="column" alignItems="center" p={2}>
          <Button onClick={() => {
            if (platform === SocialMediaPlatform.DOMAIN) {
              history.push(`/listing/${postUrl}`)  
            } else {
              history.push(`/social/${platform}/${linkedId}`)
            }
          }}>View listing on Serto Search</Button>
        </Flex>
      )}
    </RegisterGlobal>
  );
};
