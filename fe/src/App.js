import "./App.css";
import React, { useState } from "react";
import styled from "styled-components";
import reviews from "./review";
import Card from "./card";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Button from "react-bootstrap/Button";

function App() {
  const [english, setEnglish] = useState(false);
  const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-direction: column;
    background: #343434;
  `;

  const Title = styled.h1`
    text-align: center;
    font-weight: 900;
    font-size: 90px;
    color: #e2e2e2;
    margin-top: 3rem;
    margin-bottom: 3rem;
  `;
  const InnerWrapper = styled.div`
    display: flex;
    flex-direction: column;
  `;

  const Image = styled.img`
    width: 200px;
  `;
  const Subtitle = styled.div`
    display: flex;
    justify-content: center;
    color: #e2e2e2;
    font-size: 30px;
    font-weight: 700;
  `;

  const Contents = styled.div`
    color: #e2e2e2;
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  `;
  const ButtonWrapper = styled.div`
  display: block;
  margin: 1rem 0rem 1rem 1rem;
  text-align: end;
`;

  const EnDesc = `This website has implemented a Customer Service bot demo using the Amazon Bedrock service to automate responses to customer reviews.\n The demo utilizes the ANTHROPIC's CLAUDE v2 model, which is one of the various Foundation Models supported by the Amazon Bedrock service.`;
  const KoDesc = ` 이 사이트는 Amazon Bedrock 서비스를 이용해 고객의 리뷰에 대한 답변을
          자동화하는 Customer Service bot 데모를 구현했습니다.
          \n
          이 데모는 Amazon Bedrock 서비스에서 지원하는 다양한 Foundation Model
          중 ANTHROPIC의 CLAUDE v2 모델을 사용하였습니다.`;

  const handleChange = (e) => {
    if (english == true) {
      setEnglish(false);
      console.log(english);
    } else {
      setEnglish(true);
      console.log(english);
    }
  };
  return (
    <Wrapper>
      <Container>
        <Row className="justify-content-md-center">
          <Title>Customer Service bot</Title>
        </Row>
        <Row>
            <ButtonWrapper>
          <Button variant="outline-light" onClick={handleChange}>
          {english && <>Korean</>}
          {!english && <>English</>}
          
          </Button>
          </ButtonWrapper>
        </Row>
        <Row className="justify-content-md-center">
          <Image src="/bedrock.jpeg"></Image>
        </Row>
        <Row className="justify-content-md-center">
          <Subtitle>Amazon Bedrock</Subtitle>
        </Row>
        <Contents>
          {english && (<>{EnDesc}</>)}
          {!english && (<>{KoDesc}</>)}

          <br />
        </Contents>
        <Row className="justify-content-md-center">
          {!english && reviews.products.map((product) => (
            <Card
              content={product.comment}
              index={product.index}
              user={product.user}
              language="Ko"
            />
          ))}
          {english && reviews.en_reviews.map((product) => (
            <Card
              content={product.comment}
              index={product.index}
              user={product.user}
              language="En"
            />
          ))}
        </Row>
      </Container>
    </Wrapper>
  );
}

export default App;
