package models

type APIResponse struct {
	Code      int        `json:"code"`
	Data      LookupData `json:"data"`
	Cached    bool       `json:"cached"`
	Timestamp int64      `json:"timestamp"`
	Message   string     `json:"message,omitempty"`
}

type LookupData struct {
	Domain     string     `json:"domain,omitempty"`
	IP         string     `json:"ip,omitempty"`
	ReverseDNS []string   `json:"reverse_dns"`
	Records    DNSRecords `json:"records"`
}

type DNSRecords struct {
	A     []string    `json:"A"`
	AAAA  []string    `json:"AAAA"`
	CNAME []string    `json:"CNAME"`
	MX    []MXRecord  `json:"MX"`
	NS    []string    `json:"NS"`
	TXT   []string    `json:"TXT"`
	CAA   []CAARecord `json:"CAA"`
	SOA   SOARecord   `json:"SOA"`
	SRV   []SRVRecord `json:"SRV"`

	// Raw record types rendered as presentation-format strings.
	HTTPS  []string `json:"HTTPS,omitempty"`
	SVCB   []string `json:"SVCB,omitempty"`
	DS     []string `json:"DS,omitempty"`
	DNSKEY []string `json:"DNSKEY,omitempty"`
	TLSA   []string `json:"TLSA,omitempty"`
	SSHFP  []string `json:"SSHFP,omitempty"`
	NAPTR  []string `json:"NAPTR,omitempty"`
}

type MXRecord struct {
	Host string `json:"host"`
	Pref uint16 `json:"pref"`
}

type SRVRecord struct {
	Target   string `json:"target"`
	Port     uint16 `json:"port"`
	Priority uint16 `json:"priority"`
	Weight   uint16 `json:"weight"`
}

type CAARecord struct {
	Flag  uint8  `json:"flag"`
	Tag   string `json:"tag"`
	Value string `json:"value"`
}

type SOARecord struct {
	NS      string `json:"ns,omitempty"`
	MBox    string `json:"mbox,omitempty"`
	Serial  uint32 `json:"serial,omitempty"`
	Refresh uint32 `json:"refresh,omitempty"`
	Retry   uint32 `json:"retry,omitempty"`
	Expire  uint32 `json:"expire,omitempty"`
	Minttl  uint32 `json:"minttl,omitempty"`
}

func NewDNSRecords() DNSRecords {
	return DNSRecords{
		A:     []string{},
		AAAA:  []string{},
		CNAME: []string{},
		MX:    []MXRecord{},
		NS:    []string{},
		TXT:   []string{},
		CAA:   []CAARecord{},
		SOA:   SOARecord{},
		SRV:   []SRVRecord{},
	}
}
