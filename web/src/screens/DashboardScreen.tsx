import React, { useState } from 'react';
import { Menu, Bell, QrCode, X } from 'lucide-react';
import styled from 'styled-components';
import './DashboardScreen.css';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background-color: #000000;
  color: #ffffff;
  font-family: 'Space Grotesk', sans-serif;
  padding-bottom: 100px;
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #000000;
`;

const HeaderButton = styled.button`
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #1E1E1E;
  }
`;

const Content = styled.div`
  padding: 24px 20px;
  max-width: 600px;
  margin: 0 auto;
`;

const SpendingCard = styled.div`
  background: linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const SpendingLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SpendingValue = styled.div`
  font-size: 48px;
  font-weight: 700;
  color: #FFD700;
  margin-bottom: 12px;
  line-height: 1.2;
`;

const GrowthBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background-color: rgba(0, 255, 0, 0.1);
  color: #00FF00;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
`;

const AssetsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const AssetCard = styled.div`
  background-color: #1E1E1E;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: transform 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const AssetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const AssetName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const AssetValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
`;

const AssetAPY = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
`;

const ActionButton = styled.button`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  background-color: #FFD700;
  color: #000000;
  border: none;
  padding: 20px;
  font-size: 18px;
  font-weight: 700;
  font-family: 'Space Grotesk', sans-serif;
  cursor: pointer;
  border-radius: 0;
  transition: background-color 0.2s;
  z-index: 1000;

  &:hover {
    background-color: #FFE44D;
  }

  &:active {
    background-color: #E6C200;
  }
`;

const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background-color: #1E1E1E;
  border-radius: 24px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const QRCodePlaceholder = styled.div`
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #1E1E1E 0%, #2A2A2A 100%);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  margin-bottom: 24px;
`;

const QRCodeIcon = styled.div`
  width: 120px;
  height: 120px;
  background-color: rgba(255, 215, 0, 0.1);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(255, 215, 0, 0.3);
`;

const QRCodeText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
`;

const InfoText = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  line-height: 1.6;
`;

export const DashboardScreen: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const assets = [
    {
      name: 'XLM Balance',
      value: '$25,000',
      apy: '8.5%',
    },
    {
      name: 'BTC Balance',
      value: '$20,890',
      apy: '6.2%',
    },
  ];

  return (
    <DashboardContainer>
      <Header>
        <HeaderButton aria-label="Menu">
          <Menu size={24} />
        </HeaderButton>
        <HeaderButton aria-label="Notifications">
          <Bell size={24} />
        </HeaderButton>
      </Header>

      <Content>
        <SpendingCard>
          <SpendingLabel>Your Spending Power</SpendingLabel>
          <SpendingValue>$45,890</SpendingValue>
          <GrowthBadge>
            <span>↑</span>
            <span>+12.4% this month</span>
          </GrowthBadge>
        </SpendingCard>

        <AssetsList>
          {assets.map((asset, index) => (
            <AssetCard key={index}>
              <AssetHeader>
                <AssetName>{asset.name}</AssetName>
                <AssetAPY>{asset.apy} APY</AssetAPY>
              </AssetHeader>
              <AssetValue>{asset.value}</AssetValue>
            </AssetCard>
          ))}
        </AssetsList>
      </Content>

      <ActionButton onClick={() => setIsModalOpen(true)}>
        Pay with Vants
      </ActionButton>

      <ModalOverlay isOpen={isModalOpen} onClick={() => setIsModalOpen(false)}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>Scan QR Code</ModalTitle>
            <CloseButton onClick={() => setIsModalOpen(false)} aria-label="Close">
              <X size={24} />
            </CloseButton>
          </ModalHeader>
          
          <QRCodePlaceholder>
            <QRCodeIcon>
              <QrCode size={64} color="#FFD700" />
            </QRCodeIcon>
            <QRCodeText>Point your camera at the QR code</QRCodeText>
          </QRCodePlaceholder>

          <InfoText>
            Your crypto stays in your wallet. This is a non-custodial transaction.
          </InfoText>
        </ModalContent>
      </ModalOverlay>
    </DashboardContainer>
  );
};

