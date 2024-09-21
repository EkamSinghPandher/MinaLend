"use client";
import { Table, Tbody, Td, Th, Thead, Tr } from "./ui/table";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { useForm } from "react-hook-form";
import { Button } from "./ui/button";

export interface FaucetProps {
  wallet?: string;
  walletAddresses: string[]; // Array of wallet addresses to populate the table
  loading: boolean;
  onConnectWallet: () => void;
  onDrip: () => void;
}

export function Faucet({
  wallet,
  walletAddresses,
  onConnectWallet,
  onDrip,
  loading,
}: FaucetProps) {
  const lendingForm = useForm();
  const borrowingForm = useForm();

  const handleButtonClick = () => {
    if (!wallet) {
      onConnectWallet();
    } else {
      onDrip();
    }
  };

  return (
    <div>
      {/* Lending Table */}
      <Table className="w-full">
        <Thead>
          <Tr>
            <Th>Lending A Loan</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {walletAddresses.map((address, index) => (
            <Tr key={index}>
              <Td>{address}</Td>
              <Td>
                <Button
                  size="sm"
                  loading={loading}
                  onClick={() => handleButtonClick()}
                  disabled={!wallet}
                >
                  {wallet ? "Drip 💦" : "Connect wallet"}
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {/* Borrowing Table */}
      <Table className="w-full mt-6">
        <Thead>
          <Tr>
            <Th>Borrow a loan</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {walletAddresses.map((address, index) => (
            <Tr key={index}>
              <Td>{address}</Td>
              <Td>
                <Button
                  size="sm"
                  loading={loading}
                  onClick={() => handleButtonClick()}
                  disabled={!wallet}
                >
                  {wallet ? "Drip 💦" : "Connect wallet"}
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}
