/**
 * Static WSDL for the QuickBooks Web Connector SOAP service (QBWebConnectorSvc).
 * QBWC fetches this on GET (?wsdl) to learn the 8 operations, then POSTs SOAP
 * envelopes to the same URL. The tns namespace MUST be http://developer.intuit.com/
 * — QBWC hard-codes it. {SERVICE_URL} is substituted with the live endpoint at
 * request time so the <soap:address> matches wherever the Worker is deployed.
 */
export function buildWsdl(serviceUrl: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<wsdl:definitions xmlns:wsdl="http://schemas.xmlsoap.org/wsdl/"
    xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xmlns:tns="http://developer.intuit.com/"
    xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/"
    targetNamespace="http://developer.intuit.com/"
    name="QBWebConnectorSvc">
  <wsdl:types>
    <xsd:schema targetNamespace="http://developer.intuit.com/" elementFormDefault="qualified">
      <xsd:element name="serverVersion"><xsd:complexType/></xsd:element>
      <xsd:element name="serverVersionResponse"><xsd:complexType><xsd:sequence>
        <xsd:element name="serverVersionResult" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>

      <xsd:element name="clientVersion"><xsd:complexType><xsd:sequence>
        <xsd:element name="strVersion" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>
      <xsd:element name="clientVersionResponse"><xsd:complexType><xsd:sequence>
        <xsd:element name="clientVersionResult" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>

      <xsd:element name="authenticate"><xsd:complexType><xsd:sequence>
        <xsd:element name="strUserName" type="xsd:string"/>
        <xsd:element name="strPassword" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>
      <xsd:element name="authenticateResponse"><xsd:complexType><xsd:sequence>
        <xsd:element name="authenticateResult" type="tns:ArrayOfString"/></xsd:sequence></xsd:complexType></xsd:element>

      <xsd:element name="sendRequestXML"><xsd:complexType><xsd:sequence>
        <xsd:element name="ticket" type="xsd:string"/>
        <xsd:element name="strHCPResponse" type="xsd:string"/>
        <xsd:element name="strCompanyFileName" type="xsd:string"/>
        <xsd:element name="qbXMLCountry" type="xsd:string"/>
        <xsd:element name="qbXMLMajorVers" type="xsd:int"/>
        <xsd:element name="qbXMLMinorVers" type="xsd:int"/></xsd:sequence></xsd:complexType></xsd:element>
      <xsd:element name="sendRequestXMLResponse"><xsd:complexType><xsd:sequence>
        <xsd:element name="sendRequestXMLResult" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>

      <xsd:element name="receiveResponseXML"><xsd:complexType><xsd:sequence>
        <xsd:element name="ticket" type="xsd:string"/>
        <xsd:element name="response" type="xsd:string"/>
        <xsd:element name="hresult" type="xsd:string"/>
        <xsd:element name="message" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>
      <xsd:element name="receiveResponseXMLResponse"><xsd:complexType><xsd:sequence>
        <xsd:element name="receiveResponseXMLResult" type="xsd:int"/></xsd:sequence></xsd:complexType></xsd:element>

      <xsd:element name="getLastError"><xsd:complexType><xsd:sequence>
        <xsd:element name="ticket" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>
      <xsd:element name="getLastErrorResponse"><xsd:complexType><xsd:sequence>
        <xsd:element name="getLastErrorResult" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>

      <xsd:element name="closeConnection"><xsd:complexType><xsd:sequence>
        <xsd:element name="ticket" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>
      <xsd:element name="closeConnectionResponse"><xsd:complexType><xsd:sequence>
        <xsd:element name="closeConnectionResult" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>

      <xsd:element name="connectionError"><xsd:complexType><xsd:sequence>
        <xsd:element name="ticket" type="xsd:string"/>
        <xsd:element name="hresult" type="xsd:string"/>
        <xsd:element name="message" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>
      <xsd:element name="connectionErrorResponse"><xsd:complexType><xsd:sequence>
        <xsd:element name="connectionErrorResult" type="xsd:string"/></xsd:sequence></xsd:complexType></xsd:element>

      <xsd:complexType name="ArrayOfString"><xsd:sequence>
        <xsd:element name="string" type="xsd:string" minOccurs="0" maxOccurs="unbounded" nillable="true"/>
      </xsd:sequence></xsd:complexType>
    </xsd:schema>
  </wsdl:types>

  ${['serverVersion','clientVersion','authenticate','sendRequestXML','receiveResponseXML','getLastError','closeConnection','connectionError']
    .map((op) => `<wsdl:message name="${op}SoapIn"><wsdl:part name="parameters" element="tns:${op}"/></wsdl:message>
  <wsdl:message name="${op}SoapOut"><wsdl:part name="parameters" element="tns:${op}Response"/></wsdl:message>`).join('\n  ')}

  <wsdl:portType name="QBWebConnectorSvcSoap">
    ${['serverVersion','clientVersion','authenticate','sendRequestXML','receiveResponseXML','getLastError','closeConnection','connectionError']
      .map((op) => `<wsdl:operation name="${op}">
      <wsdl:input message="tns:${op}SoapIn"/><wsdl:output message="tns:${op}SoapOut"/></wsdl:operation>`).join('\n    ')}
  </wsdl:portType>

  <wsdl:binding name="QBWebConnectorSvcSoap" type="tns:QBWebConnectorSvcSoap">
    <soap:binding transport="http://schemas.xmlsoap.org/soap/http" style="document"/>
    ${['serverVersion','clientVersion','authenticate','sendRequestXML','receiveResponseXML','getLastError','closeConnection','connectionError']
      .map((op) => `<wsdl:operation name="${op}">
      <soap:operation soapAction="http://developer.intuit.com/${op}" style="document"/>
      <wsdl:input><soap:body use="literal"/></wsdl:input>
      <wsdl:output><soap:body use="literal"/></wsdl:output></wsdl:operation>`).join('\n    ')}
  </wsdl:binding>

  <wsdl:service name="QBWebConnectorSvc">
    <wsdl:port name="QBWebConnectorSvcSoap" binding="tns:QBWebConnectorSvcSoap">
      <soap:address location="${serviceUrl}"/>
    </wsdl:port>
  </wsdl:service>
</wsdl:definitions>`;
}
