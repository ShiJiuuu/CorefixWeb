# B300 server information used by the animation

Primary source: `../SM B300.pdf` (`SuperServer SYS-822GS-NB3RT User's Manual`, MNL-2867, Revision 1.0a).

Internal-layout cross-references: the supplied exploded-view reference image,
and the B300-specific architecture description and geometry in the parent
project at `../../src/components/server-model/scene.ts`.

## System identity

- Product: SuperServer SYS-822GS-NB3RT (pages 1, 13)
- Motherboard: X14DBG-LC (page 13)
- Chassis: CSE-GP807TS-R000NP (page 13)
- Form factor: 8U rackmount, 13.8 x 17.6 x 37.4 in. / 356 x 449 x 950 mm (page 13)

## Compute and memory

- Accelerators: Eight NVIDIA B300 GPU modules arranged as two rows of four on the upper GPU tray
- Fabric: GPU baseboard and NVLink switch fabric connect the eight modules as one scale-up domain
- Processors: Dual Intel Xeon 6700/6500-series processors with P-cores (page 13)
- Processor socket: Socket E2, LGA 4710 (page 13)
- Processor interconnect: Four UPIs, up to 24 GT/s (page 13)
- Processor TDP: Up to 350 W (page 13)
- Memory: 32 ECC DDR5 DIMM slots total (page 13)
- Memory speed and capacity: Up to 6400 MT/s in 1DPC with up to 16 DIMMs; up to 5200 MT/s in 2DPC with up to 32 DIMMs, depending on the processors (page 13)

## Storage and expansion

- Front storage: Eight hot-swappable E1.S NVMe drive bays (page 13)
- Additional storage: Two front hot-swappable M.2 NVMe slots, M-key, RAID support via the S3808N controller (page 13)
- Expansion: Two PCIe 5.0 x16 full-height, half-length slots, routed from a PLX switch for north-south traffic (pages 13, 16)

## Cooling and power

- System cooling: 12 heavy-duty fans with optimal fan-speed control (page 13)
- Internal main components: Four internal fans (page 21)
- Power: Six redundant 6,600 W power supplies in a 3 + 3 configuration (page 13)
- Efficiency: 80 PLUS Titanium, 96% (page 13)

## I/O and network

- Eight OSFP ports for east-west traffic, described as NVIDIA ConnectX-8 ports up to 800 Gb/s (page 15)
- One dedicated LAN IPMI port (page 15)
- Dual 10G RJ45 ports (page 15)
- One front USB 3.0 Type-A port (page 15)
- One front USB 2.0 Type-A port (page 15)
- One VGA port and one Mini DisplayPort (page 15)

## Internal main components

- Upper compute tray: eight GPU modules on the GPU baseboard
- Lower control tray: dual processors, 32 DDR5 DIMM slots, PCIe switches and four internal fans
- Front service modules: eight OSFP ports and eight E1.S drive bays
- Rear cooling wall: 12 fans
- Power side bay: six supplies arranged in two columns of three
